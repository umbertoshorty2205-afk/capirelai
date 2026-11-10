import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import particleVertexShader from './shaders/particle-vertex.glsl?raw';
import particleFragmentShader from './shaders/particle-fragment.glsl?raw';
import simulationVertexShader from './shaders/simulation-vertex.glsl?raw';
import simulationFragmentShader from './shaders/simulation-fragment.glsl?raw';
import velocityFragmentShader from './shaders/velocity-fragment.glsl?raw';

const PARTICLE_COUNT = 262144; // 512x512
const TEXTURE_SIZE = 512;

interface CapirelAiHeroProps {
  className?: string;
}

export const CapirelAiHero: React.FC<CapirelAiHeroProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Three.js objects
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const simulationMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const velocityMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const velocityTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, influence: 0 });
  const clockRef = useRef(new THREE.Clock());

  // Initialize shaders and textures
  const initTextures = useMemo(() => {
    // Create initial position data (random positions in a sphere)
    const positions = new Float32Array(PARTICLE_COUNT * 4);
    const velocities = new Float32Array(PARTICLE_COUNT * 4);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spherical distribution with concentration toward ring shape
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 0.8;

      // Bias toward torus/ring shape
      const ringBias = Math.random();
      let x, y, z;

      if (ringBias < 0.6) {
        // 60% on ring
        const ringTheta = Math.random() * Math.PI * 2;
        const ringPhi = (Math.random() - 0.5) * Math.PI * 0.5;
        const ringRadius = 0.8 + (Math.random() - 0.5) * 0.3;

        x = ringRadius * Math.cos(ringTheta);
        y = ringRadius * Math.sin(ringPhi) * 0.3;
        z = ringRadius * Math.sin(ringTheta);
      } else {
        // 40% spherical cloud
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);
      }

      const idx = i * 4;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      positions[idx + 3] = 1.0;

      // Initial velocity - tangential to ring
      velocities[idx] = -z * 0.01;
      velocities[idx + 1] = (Math.random() - 0.5) * 0.01;
      velocities[idx + 2] = x * 0.01;
      velocities[idx + 3] = 0.0;
    }

    const positionTexture = new THREE.DataTexture(
      positions,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionTexture.needsUpdate = true;
    positionTexture.minFilter = THREE.NearestFilter;
    positionTexture.magFilter = THREE.NearestFilter;
    positionTexture.generateMipmaps = false;

    const velocityTexture = new THREE.DataTexture(
      velocities,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    velocityTexture.needsUpdate = true;
    velocityTexture.minFilter = THREE.NearestFilter;
    velocityTexture.magFilter = THREE.NearestFilter;
    velocityTexture.generateMipmaps = false;

    return { positionTexture, velocityTexture };
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Enable extensions for float textures
    const gl = renderer.getContext();
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');
    gl.getExtension('WEBGL_color_buffer_float');

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Simulation render targets (ping-pong)
    const simTarget = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const velTarget = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
    });

    renderTargetRef.current = simTarget;
    velocityTargetRef.current = velTarget;

    // Simulation material (position update)
    const simulationMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
      uniforms: {
        positionTexture: { value: initTextures.positionTexture },
        velocityTexture: { value: initTextures.velocityTexture },
        time: { value: 0 },
        deltaTime: { value: 0 },
        mousePosition: { value: new THREE.Vector2(0, 0) },
        mouseInfluence: { value: 0 },
        bounds: { value: 1.5 },
        ringRadius: { value: 0.8 },
        tubeRadius: { value: 0.3 },
      },
      depthWrite: false,
      depthTest: false,
    });
    simulationMaterialRef.current = simulationMaterial;

    // Velocity material (velocity update)
    const velocityMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: velocityFragmentShader,
      uniforms: {
        positionTexture: { value: initTextures.positionTexture },
        velocityTexture: { value: initTextures.velocityTexture },
        time: { value: 0 },
        deltaTime: { value: 0 },
        mousePosition: { value: new THREE.Vector2(0, 0) },
        mouseInfluence: { value: 0 },
        bounds: { value: 1.5 },
        ringRadius: { value: 0.8 },
        tubeRadius: { value: 0.3 },
      },
      depthWrite: false,
      depthTest: false,
    });
    velocityMaterialRef.current = velocityMaterial;

    // Full-screen quad for simulation
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const quadMesh = new THREE.Mesh(quadGeometry, simulationMaterial);
    const simScene = new THREE.Scene();
    simScene.add(quadMesh);

    // Particle geometry (points)
    const particleGeometry = new THREE.BufferGeometry();
    const uvArray = new Float32Array(PARTICLE_COUNT * 2);
    const indexArray = new Uint32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
      const y = Math.floor(i / TEXTURE_SIZE) / TEXTURE_SIZE;
      uvArray[i * 2] = x + 0.5 / TEXTURE_SIZE;
      uvArray[i * 2 + 1] = y + 0.5 / TEXTURE_SIZE;
      indexArray[i] = i;
    }

    particleGeometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    particleGeometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    // Particle material (rendering)
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        positionTexture: { value: simTarget.texture },
        velocityTexture: { value: velTarget.texture },
        time: { value: 0 },
        deltaTime: { value: 0 },
        mousePosition: { value: new THREE.Vector2(0, 0) },
        mouseInfluence: { value: 0.8 },
        pointSize: { value: 2.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.frustumCulled = false;
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.influence = 0.8;
    };

    const handleMouseLeave = () => {
      mouseRef.current.influence = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        mouseRef.current.influence = 0.8;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.influence = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // Resize handler
    const handleResize = () => {
      if (renderer && camera) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();
      timeRef.current += deltaTime;

      // Smooth mouse influence decay
      mouseRef.current.influence *= 0.98;

      // Update simulation uniforms
      if (simulationMaterialRef.current) {
        simulationMaterialRef.current.uniforms.time.value = timeRef.current;
        simulationMaterialRef.current.uniforms.deltaTime.value = deltaTime;
        simulationMaterialRef.current.uniforms.mousePosition.value.set(
          mouseRef.current.x,
          mouseRef.current.y
        );
        simulationMaterialRef.current.uniforms.mouseInfluence.value = mouseRef.current.influence;
      }

      if (velocityMaterialRef.current) {
        velocityMaterialRef.current.uniforms.time.value = timeRef.current;
        velocityMaterialRef.current.uniforms.deltaTime.value = deltaTime;
        velocityMaterialRef.current.uniforms.mousePosition.value.set(
          mouseRef.current.x,
          mouseRef.current.y
        );
        velocityMaterialRef.current.uniforms.mouseInfluence.value = mouseRef.current.influence;
      }

      // Ping-pong simulation: position -> velocity -> position
      if (renderer && simTarget && velTarget) {
        // Step 1: Update positions using current velocity
        quadMesh.material = simulationMaterial;
        renderer.setRenderTarget(simTarget);
        renderer.render(simScene, camera);

        // Step 2: Update velocities using new positions
        quadMesh.material = velocityMaterial;
        renderer.setRenderTarget(velTarget);
        renderer.render(simScene, camera);

        // Step 3: Render particles
        renderer.setRenderTarget(null);

        // Update particle material with new textures
        particleMaterial.uniforms.positionTexture.value = simTarget.texture;
        particleMaterial.uniforms.velocityTexture.value = velTarget.texture;
        particleMaterial.uniforms.time.value = timeRef.current;
        particleMaterial.uniforms.deltaTime.value = deltaTime;
        particleMaterial.uniforms.mousePosition.value.set(
          mouseRef.current.x,
          mouseRef.current.y
        );
        particleMaterial.uniforms.mouseInfluence.value = mouseRef.current.influence;

        // Subtle camera rotation for depth
        camera.position.x = Math.sin(timeRef.current * 0.05) * 0.15;
        camera.position.y = Math.cos(timeRef.current * 0.03) * 0.1;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
    };

    animate();

    setIsLoaded(true);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);

      cancelAnimationFrame(animationIdRef.current);

      // Dispose Three.js resources
      simulationMaterial?.dispose();
      velocityMaterial?.dispose();
      particleMaterial?.dispose();
      particleGeometry?.dispose();
      quadGeometry?.dispose();
      simTarget?.dispose();
      velTarget?.dispose();
      initTextures.positionTexture?.dispose();
      initTextures.velocityTexture?.dispose();

      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [prefersReducedMotion]);

  if (!isLoaded || prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        className={`capirelai-hero-fallback ${className}`}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1526 50%, #0a0f1a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden={prefersReducedMotion}
      >
        <div style={{ textAlign: 'center', zIndex: 10, padding: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #00d4aa 0%, #00f5d4 50%, #00d4aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}>
            CapirelAI
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '600px',
            margin: '0 auto 1.5rem',
            fontWeight: '400',
            lineHeight: 1.6,
          }}>
            Forum &bull; Est. 2026
          </p>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '500px',
            margin: '0 auto',
            fontWeight: '300',
            lineHeight: 1.7,
          }}>
            L'intelligenza artificiale spiegata in italiano. Senza hype, con chiarezza e con prove pratiche.
          </p>
        </div>
        {prefersReducedMotion && (
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
          }}>
            Animazioni ridotte attive per rispetto delle preferenze di accessibilità
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`capirelai-hero ${className}`}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1526 50%, #0a0f1a 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          pointerEvents: 'none',
        }}
      >
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #00d4aa 0%, #00f5d4 50%, #00d4aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          textShadow: '0 0 60px rgba(0, 212, 170, 0.3)',
          animation: 'pulse 4s ease-in-out infinite',
        }}>
          CapirelAI
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: '600px',
          margin: '0 auto 1.5rem',
          fontWeight: '500',
          lineHeight: 1.6,
          textShadow: '0 0 30px rgba(0, 212, 170, 0.2)',
        }}>
          Forum &bull; Est. 2026
        </p>
        <p style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '500px',
          margin: '0 auto 2rem',
          fontWeight: '300',
          lineHeight: 1.7,
        }}>
          L'intelligenza artificiale spiegata in italiano. Senza hype, con chiarezza e con prove pratiche.
        </p>
        <a
          href="/concetti"
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
            color: '#0a0f1a',
            borderRadius: '9999px',
            fontWeight: '700',
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            textDecoration: 'none',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 30px rgba(0, 212, 170, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 212, 170, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 212, 170, 0.4)';
          }}
        >
          Inizia dai concetti →
        </a>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        .capirelai-hero canvas {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default CapirelAiHero;