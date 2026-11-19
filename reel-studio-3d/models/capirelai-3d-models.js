/**
 * Capire l'AI — Libreria Permanente Modelli 3D per Instagram Reels (@capirelai)
 * Moduli Three.js compositi PBR riutilizzabili in tutti i futuri Reel 3D.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function makeRoundedSquareShape(size, radius) {
  const s = new THREE.Shape();
  const h = size / 2;
  s.moveTo(-h + radius, -h);
  s.lineTo(h - radius, -h);
  s.quadraticCurveTo(h, -h, h, -h + radius);
  s.lineTo(h, h - radius);
  s.quadraticCurveTo(h, h, h - radius, h);
  s.lineTo(-h + radius, h);
  s.quadraticCurveTo(-h, h, -h, h - radius);
  s.lineTo(-h, -h + radius);
  s.quadraticCurveTo(-h, -h, -h + radius, -h);
  return s;
}

/**
 * 1. Studio Lighting Rig + RoomEnvironment PMREM (Warm/Cool 3-point cinema lighting)
 */
export function createStudioLightingRig(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0b1120, 0.9);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
  keyLight.position.set(5, 8, 7);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x38bdf8, 18, 28);
  rimLight.position.set(0, 2.5, -3.5);
  scene.add(rimLight);

  const accentLight = new THREE.PointLight(0x06b6d4, 12, 22);
  accentLight.position.set(-4, -1, 4);
  scene.add(accentLight);

  return { hemiLight, keyLight, rimLight, accentLight };
}

/**
 * 2. Floating Atmospheric Dust Field (always-alive volumetric depth)
 */
export function createFloatingDustField(count = 420, colorHex = 0x38bdf8) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s = ((i * 9301 + 49297) % 233280) / 233280;
    const s2 = (((i + 71) * 9301 + 49297) % 233280) / 233280;
    const s3 = (((i + 193) * 9301 + 49297) % 233280) / 233280;
    pos[i * 3] = (s - 0.5) * 18;
    pos[i * 3 + 1] = (s2 - 0.5) * 24;
    pos[i * 3 + 2] = (s3 - 0.5) * 16 - 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.055,
    transparent: true,
    opacity: 0.65,
  });
  const points = new THREE.Points(geo, mat);
  return { points, material: mat };
}

/**
 * 3. Composite 3D Curved Ultrawide Studio Monitor + Desk + Keyboard Silhouette
 * Signature opener prop for @capirelai Reels (camera dollies straight into screen).
 */
export function createCurvedStudioMonitor(renderer) {
  const group = new THREE.Group();

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 512;
  const ctx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const radius = 4.6;
  const thetaLen = 0.54;

  // OLED Curved Display Surface (self-lit, zero glare washout)
  const screenGeo = new THREE.CylinderGeometry(
    radius,
    radius,
    1.52,
    48,
    1,
    true,
    Math.PI - thetaLen / 2,
    thetaLen
  );
  screenGeo.scale(-1, 1, 1);
  const screenMesh = new THREE.Mesh(
    screenGeo,
    new THREE.MeshBasicMaterial({ map: screenTexture })
  );
  screenMesh.position.set(0, 0.15, radius - 0.1);
  group.add(screenMesh);

  // Brushed Aluminum Curved Bezel Shell
  const bezelGeo = new THREE.CylinderGeometry(
    radius + 0.07,
    radius + 0.07,
    1.70,
    48,
    1,
    true,
    Math.PI - (thetaLen + 0.05) / 2,
    thetaLen + 0.05
  );
  const bezelMesh = new THREE.Mesh(
    bezelGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.88,
      roughness: 0.24,
      side: THREE.DoubleSide,
    })
  );
  bezelMesh.position.set(0, 0.15, radius - 0.08);
  group.add(bezelMesh);

  // Cyan Studio Ambilight Bar
  const glowBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.09, 0.09),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  glowBar.position.set(0, 1.04, -0.32);
  group.add(glowBar);

  // Sculpted Stand Neck & Weighted Base
  const metalDark = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.24,
  });
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.28, 0.14), metalDark);
  neck.position.set(0, -1.14, -0.34);
  neck.rotation.x = 0.12;
  group.add(neck);

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.82), metalDark);
  base.position.set(0, -1.78, -0.15);
  group.add(base);

  // Matte Obsidian Studio Desk
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 7),
    new THREE.MeshStandardMaterial({
      color: 0x030710,
      metalness: 0.35,
      roughness: 0.52,
    })
  );
  desk.rotation.x = -Math.PI / 2;
  desk.position.set(0, -1.82, 0.8);
  group.add(desk);

  // Foreground Laptop / Keyboard Silhouette
  const kbBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.05, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.28 })
  );
  kbBody.position.set(0, -1.78, 1.02);
  group.add(kbBody);

  const kbGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.62),
    new THREE.MeshBasicMaterial({ color: 0x0c4a6e })
  );
  kbGlow.rotation.x = -Math.PI / 2;
  kbGlow.position.set(0, -1.75, 1.02);
  group.add(kbGlow);

  return { group, screenCanvas, screenCtx: ctx, screenTexture, glowBar };
}

/**
 * 4. Composite 3D Beveled Token Cube (ExtrudeGeometry + Edges + Dual Canvas Plates)
 */
export function createBeveledTokenCube(renderer, {
  label = 'apple',
  idStr = 'ID #4218',
  footerStr = 'BPE TOKEN',
  accentHex = 0x34d399,
  coreHex = 0x064e3b,
  size = 1.42,
} = {}) {
  const grp = new THREE.Group();
  const shape = makeRoundedSquareShape(size, 0.17);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: size * 0.72,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.08,
    bevelSegments: 4,
  });
  geo.center();

  const coreMesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: coreHex,
      metalness: 0.82,
      roughness: 0.2,
    })
  );
  grp.add(coreMesh);

  grp.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 22),
      new THREE.LineBasicMaterial({ color: accentHex })
    )
  );

  const hexCss = '#' + accentHex.toString(16).padStart(6, '0');
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#060c18';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = hexCss;
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.fillStyle = hexCss;
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(idStr, 256, 128);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px sans-serif';
  ctx.fillText(label, 256, 295);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(footerStr, 256, 415);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.86, size * 0.86),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  plate.position.z = size * 0.36 + 0.10;
  grp.add(plate);

  const backPlate = plate.clone();
  backPlate.position.z = -(size * 0.36 + 0.10);
  backPlate.rotation.y = Math.PI;
  grp.add(backPlate);

  return grp;
}

/**
 * 5. Sculptural 3D Monolith Pillar (R · O · F / 3-Step Framework Blocks)
 */
export function createMonolithPillar(renderer, {
  letter = 'R',
  accentHex = 0x38bdf8,
  coreHex = 0x082f49,
} = {}) {
  const grp = new THREE.Group();
  const shape = makeRoundedSquareShape(1.12, 0.14);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 4,
  });
  geo.center();

  grp.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: coreHex,
        metalness: 0.88,
        roughness: 0.18,
      })
    )
  );

  grp.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 22),
      new THREE.LineBasicMaterial({ color: accentHex })
    )
  );

  const hexCss = '#' + accentHex.toString(16).padStart(6, '0');
  const mc = document.createElement('canvas');
  mc.width = 256;
  mc.height = 256;
  const mctx = mc.getContext('2d');
  mctx.fillStyle = '#050b16';
  mctx.fillRect(0, 0, 256, 256);
  mctx.strokeStyle = hexCss;
  mctx.lineWidth = 10;
  mctx.strokeRect(14, 14, 228, 228);
  mctx.fillStyle = hexCss;
  mctx.font = 'bold 148px sans-serif';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.fillText(letter, 128, 134);

  const mtex = new THREE.CanvasTexture(mc);
  mtex.colorSpace = THREE.SRGBColorSpace;
  mtex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mplate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.90, 0.90),
    new THREE.MeshBasicMaterial({ map: mtex })
  );
  mplate.position.z = 0.305;
  grp.add(mplate);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.70, 0.026, 12, 48),
    new THREE.MeshBasicMaterial({ color: accentHex })
  );
  ring.position.z = -0.32;
  grp.add(ring);

  return grp;
}

/**
 * 6. Signature Capire l'AI 3D Neural Torus Orb (Outro & Tech Backdrop)
 */
export function createNeuralTorusOrb({
  pointsHex = 0x38bdf8,
  wireHex = 0x0284c7,
  ringHex = 0x4ade80,
} = {}) {
  const group = new THREE.Group();

  const torusGeo = new THREE.TorusKnotGeometry(1.55, 0.44, 160, 28);
  const pointsMat = new THREE.PointsMaterial({
    color: pointsHex,
    size: 0.048,
    transparent: true,
    opacity: 0.9,
  });
  const torusPoints = new THREE.Points(torusGeo, pointsMat);
  group.add(torusPoints);

  const innerWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 1),
    new THREE.MeshStandardMaterial({
      color: wireHex,
      metalness: 0.92,
      roughness: 0.15,
      wireframe: true,
    })
  );
  group.add(innerWire);

  const ringMat = new THREE.MeshBasicMaterial({ color: ringHex });
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.025, 16, 80), ringMat);
  outerRing.rotation.x = Math.PI * 0.38;
  group.add(outerRing);

  return { group, torusPoints, pointsMat, innerWire, outerRing, ringMat };
}

/**
 * 7. Perspective Cyber Grid Floor
 */
export function createCyberGridFloor(y = -2.8) {
  const grid = new THREE.GridHelper(32, 32, 0x38bdf8, 0x0f2540);
  grid.position.set(0, y, 0);
  return grid;
}
