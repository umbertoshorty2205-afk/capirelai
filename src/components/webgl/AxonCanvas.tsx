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

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width <= 760;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const baseCamPos = new THREE.Vector3(0, 0, 5.8);
    const cameraOffset = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();
    const matcapTexture = createMatcapTexture();
    const fluidSim = new GPUFluidSimulation();
    const particleSys = new ParticleSimulationSystem(isMobile, matcapTexture);

    scene.add(particleSys.group);
    particleSys.initSimulation(renderer);

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

    const onPointerMove = (e: MouseEvent | Touch) => {
      const px = e.clientX;
      const py = e.clientY;
      mouse.len = Math.hypot(px - rawPixelX, py - rawPixelY);
      rawPixelX = px;
      rawPixelY = py;

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = Math.min(Math.max(px / width, 0.0), 1.0);
      mouse.y = Math.min(Math.max(py / height, 0.0), 1.0);
      mouse.dx = mouse.x - mouse.prevX;
      mouse.dy = mouse.y - mouse.prevY;
      mouse.time = performance.now();
    };

    window.addEventListener('mousemove', (e) => onPointerMove(e), { passive: true });
    window.addEventListener('touchmove', (e) => { if (e.touches.length > 0) onPointerMove(e.touches[0]); }, { passive: true });

    // Tracciamento dello scroll per la rotazione 3D
    let scrollProgress = 0;
    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0.0), 1.0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      particleSys.pointsMaterial.uniforms.uDPR.value = dpr;
      handleScroll();
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId = 0;
    const clock = new THREE.Clock();
    const targetCameraPos = new THREE.Vector3();

    const baseRotX = (-28.4 * Math.PI) / 180;
    const baseRotY = (390 * Math.PI) / 180;
    const baseRotZ = (4.92 * Math.PI) / 180;
    let currentScrollProgress = 0;

    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Damping morbido dello scroll
      currentScrollProgress += (scrollProgress - currentScrollProgress) * 0.08;

      // Rotazione dell'anello 3D con lo scroll
      particleSys.group.rotation.y = baseRotY + currentScrollProgress * Math.PI * 2.0;
      particleSys.group.rotation.x = baseRotX + Math.sin(currentScrollProgress * Math.PI * 2.0) * 0.4;
      particleSys.group.rotation.z = baseRotZ + Math.cos(currentScrollProgress * Math.PI) * 0.2;

      // Spostamento orbitale della telecamera con lo scroll
      const scrollCamX = Math.sin(currentScrollProgress * Math.PI * 2.0) * 0.6;
      const scrollCamY = -currentScrollProgress * 0.8 + Math.cos(currentScrollProgress * Math.PI) * 0.3;
      const scrollCamZ = Math.sin(currentScrollProgress * Math.PI * 3.0) * 0.4;

      const mappedX = mouse.x * 2.0 - 1.0;
      const mappedY = mouse.y * 2.0 - 1.0;
      targetCameraPos.x = baseCamPos.x + cameraOffset.x + scrollCamX + mappedX * -0.7;
      targetCameraPos.y = baseCamPos.y + cameraOffset.y + scrollCamY + mappedY * 1.3;
      targetCameraPos.z = baseCamPos.z + cameraOffset.z + scrollCamZ;

      camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
      camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
      camera.position.z += (targetCameraPos.z - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      fluidSim.step(renderer, mouse, width / height, width <= 760);
      mouse.len *= 0.5;

      particleSys.step(renderer, camera, fluidSim.velocity.read.texture, fluidSim.density.read.texture, elapsedTime, delta);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
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
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 0, pointerEvents: 'none' }}
    />
  );
};