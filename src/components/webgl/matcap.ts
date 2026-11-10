import * as THREE from 'three';

export function createMatcapTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get context');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 64, 64);

  const grad = ctx.createRadialGradient(25, 23, 1, 32, 32, 30);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.18, '#e4e4e7');
  grad.addColorStop(0.45, '#8e8e93');
  grad.addColorStop(0.8, '#2c2c2e');
  grad.addColorStop(1.0, '#0a0a0c');

  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}