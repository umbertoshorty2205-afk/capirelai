import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMatcapTexture } from './matcap';
import { GPUFluidSimulation, MouseMotion } from './fluid';
import { ParticleSimulationSystem } from './particleSim';

export const AxonCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect software WebGL to pace appropriately and set pixel ratio
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width <= 760;

    // 1. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    // 2. Camera setup: FOV 30, near 0.1, far 1000, centered at (0, 0, 5.8) looking at (0, 0, 0)
    const baseCamPos = new THREE.Vector3(0, 0, 5.8);
    const cameraOffset = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0, 0);

    // Dynamic 3D camera angle transitions from UI hover
    const handleSectionHover = (e: CustomEvent<{ offset?: [number, number, number] }>) => {
      if (e.detail?.offset) {
        cameraOffset.set(e.detail.offset[0], e.detail.offset[1], e.detail.offset[2]);
      } else {
        cameraOffset.set(0, 0, 0);
      }
    };
    window.addEventListener('capirelai:section-hover', handleSectionHover as EventListener);

    const scene = new THREE.Scene();

    // 3. Matcap & Simulations
    const matcapTexture = createMatcapTexture();
    const fluidSim = new GPUFluidSimulation();
    const particleSys = new ParticleSimulationSystem(isMobile, matcapTexture);

    scene.add(particleSys.group);
    particleSys.initSimulation(renderer);

    // Mouse tracking for fluid simulation & gaze camera
    const mouse: MouseMotion = {
      x: 0.5,
      y: 0.5,
      prevX: 0.5,
      prevY: 0.5,
      dx: 0,
      dy: 0,
      len: 0,
      time: performance.now(),
    };

    let rawPixelX = width * 0.5;
    let rawPixelY = height * 0.5;
    let prevRawPixelX = rawPixelX;
    let prevRawPixelY = rawPixelY;

    const onPointerMove = (e: MouseEvent | Touch) => {
      const px = e.clientX;
      const py = e.clientY;

      const dxPx = px - rawPixelX;
      const dyPx = py - rawPixelY;
      const lenPx = Math.hypot(dxPx, dyPx);

      prevRawPixelX = rawPixelX;
      prevRawPixelY = rawPixelY;
      rawPixelX = px;
      rawPixelY = py;

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = Math.min(Math.max(px / width, 0.0), 1.0);
      mouse.y = Math.min(Math.max(py / height, 0.0), 1.0);
      mouse.dx = mouse.x - mouse.prevX;
      mouse.dy = mouse.y - mouse.prevY;
      mouse.len = lenPx;
      mouse.time = performance.now();
    };

    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0]);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        rawPixelX = e.touches[0].clientX;
        rawPixelY = e.touches[0].clientY;
        prevRawPixelX = rawPixelX;
        prevRawPixelY = rawPixelY;
        mouse.x = rawPixelX / width;
        mouse.y = rawPixelY / height;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.len = 0;
        mouse.dx = 0;
        mouse.dy = 0;
        mouse.time = performance.now();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Scroll tracking for dynamic 3D ring rotation & camera choreography
    let scrollProgress = 0;
    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0.0), 1.0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle Resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      particleSys.pointsMaterial.uniforms.uDPR.value = dpr;
      handleScroll();
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId = 0;
    let clock = new THREE.Clock();

    const targetCameraPos = new THREE.Vector3();
    const baseRotX = (-28.4 * Math.PI) / 180;
    const baseRotY = (390 * Math.PI) / 180;
    const baseRotZ = (4.92 * Math.PI) / 180;

    let currentScrollProgress = 0;

    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth damp scroll progress
      currentScrollProgress += (scrollProgress - currentScrollProgress) * 0.08;

      // Rotate 3D particle group as user scrolls
      particleSys.group.rotation.y = baseRotY + currentScrollProgress * Math.PI * 2.0;
      particleSys.group.rotation.x = baseRotX + Math.sin(currentScrollProgress * Math.PI * 2.0) * 0.4;
      particleSys.group.rotation.z = baseRotZ + Math.cos(currentScrollProgress * Math.PI) * 0.2;

      // Scroll-driven camera choreographies
      const scrollCamX = Math.sin(currentScrollProgress * Math.PI * 2.0) * 0.6;
      const scrollCamY = -currentScrollProgress * 0.8 + Math.cos(currentScrollProgress * Math.PI) * 0.3;
      const scrollCamZ = Math.sin(currentScrollProgress * Math.PI * 3.0) * 0.4;

      // Gaze camera + scroll choreographies
      const mappedX = (mouse.x * 2.0 - 1.0);
      const mappedY = (mouse.y * 2.0 - 1.0);

      targetCameraPos.x = baseCamPos.x + cameraOffset.x + scrollCamX + mappedX * (-0.7);
      targetCameraPos.y = baseCamPos.y + cameraOffset.y + scrollCamY + mappedY * 1.3;
      targetCameraPos.z = baseCamPos.z + cameraOffset.z + scrollCamZ;

      camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
      camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
      camera.position.z += (targetCameraPos.z - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      // Step GPU fluid
      const aspect = width / height;
      fluidSim.step(renderer, mouse, aspect, width <= 760);

      // Decay mouse movement length for next frame
      mouse.len *= 0.5;

      // Step particle simulation
      particleSys.step(
        renderer,
        camera,
        fluidSim.velocity.read.texture,
        fluidSim.density.read.texture,
        elapsedTime,
        delta
      );

      // Render particle scene
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('capirelai:section-hover', handleSectionHover as EventListener);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);

      fluidSim.dispose();
      particleSys.dispose();
      matcapTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      id="bg"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      className="fixed inset-0 w-full h-full block z-0 pointer-events-none select-none"
    />
  );
};
