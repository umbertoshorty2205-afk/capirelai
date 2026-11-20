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

function makeRoundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

/**
 * 8. Composite 3D Smartphone PBR (Extruded Titanium Body + Dual Optical Cameras + Live OLED Canvas + Dock)
 * Grounded at bottom-center (y = 0) so it rests cleanly on any desk surface.
 */
export function createSmartphone3D(renderer, {
  accentHex = 0x38bdf8,
  title = 'ChatGPT',
  badge = 'PROMPT GENERICO ✕',
  bodyLine1 = 'Nel dinamico panorama',
  bodyLine2 = 'attuale desidero...',
} = {}) {
  const group = new THREE.Group();

  // Weighted Charging Stand Dock (grounded at y = 0)
  const dockBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.62, 0.12, 36),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 })
  );
  dockBase.position.set(0, 0.06, 0);
  group.add(dockBase);

  const dockNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.26, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
  );
  dockNeck.position.set(0, 0.22, -0.05);
  group.add(dockNeck);

  // Titanium Unibody Frame
  const bodyShape = makeRoundedRectShape(1.18, 2.34, 0.18);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 4,
  });
  bodyGeo.center();

  const phoneAssembly = new THREE.Group();
  phoneAssembly.position.set(0, 1.46, 0.04);
  phoneAssembly.rotation.x = -0.06;
  group.add(phoneAssembly);

  const chassis = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({
      color: 0xdbe4ee,
      metalness: 0.88,
      roughness: 0.2,
    })
  );
  phoneAssembly.add(chassis);

  // Rim highlight
  phoneAssembly.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo, 28),
      new THREE.LineBasicMaterial({ color: accentHex })
    )
  );

  // Front Self-Lit OLED Display (CanvasTexture SRGB)
  const sc = document.createElement('canvas');
  sc.width = 512;
  sc.height = 1024;
  const ctx = sc.getContext('2d');
  ctx.fillStyle = '#050b16';
  ctx.fillRect(0, 0, 512, 1024);

  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#0a192f');
  grad.addColorStop(1, '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(20, 20, 472, 984);

  // Dynamic Island
  ctx.fillStyle = '#000000';
  ctx.fillRect(186, 44, 140, 32);

  // Header
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`● ${title}`, 256, 140);

  // Badge
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.fillRect(54, 185, 404, 64);
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 185, 404, 64);
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(badge, 256, 226);

  // Card text
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(46, 295, 420, 380);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 295, 420, 380);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(bodyLine1, 256, 430);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(bodyLine2, 256, 490);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('@CAPIRELAI  •  3D', 256, 920);

  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 2.16),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screenPlane.position.z = 0.088;
  phoneAssembly.add(screenPlane);

  // Rear Camera Island & Dual Optical Lenses (visible when camera orbits!)
  const camIsland = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.56, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
  );
  camIsland.position.set(-0.24, 0.72, -0.095);
  phoneAssembly.add(camIsland);

  const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 });
  const lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.2, roughness: 0.05 });
  for (const ly of [0.85, 0.60]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), lensRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-0.32, ly, -0.125);
    phoneAssembly.add(ring);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 24), lensGlassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(-0.32, ly, -0.13);
    phoneAssembly.add(glass);
  }

  return { group, screenCanvas: sc, screenCtx: ctx, screenTex };
}

/**
 * 9. Composite 3D Studio Coffee Cup (Lathe Cup + Textured Sleeve + Molded Lid)
 * Pivot grounded at bottom-center (y = 0).
 */
export function createCoffeeCup3D({ sleeveHex = 0xd97706 } = {}) {
  const grp = new THREE.Group();

  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.32, 0.82),
    new THREE.Vector2(0.30, 0.83),
  ];
  const cupBody = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 32),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.68, metalness: 0.06 })
  );
  grp.add(cupBody);

  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.295, 0.265, 0.36, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: sleeveHex, roughness: 0.86, metalness: 0.04, side: THREE.DoubleSide })
  );
  sleeve.position.y = 0.44;
  grp.add(sleeve);

  const lidMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.25 });
  const lidBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.33, 0.07, 32), lidMat);
  lidBase.position.y = 0.84;
  grp.add(lidBase);

  const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 32), lidMat);
  lidTop.position.y = 0.90;
  grp.add(lidTop);

  return grp;
}

/**
 * 10. Composite 3D Mechanical Keyboard (Anodized Aluminum Unibody + InstancedMesh Keycaps)
 * Pivot grounded at bottom-center (y = 0). Single draw call for 60 keycaps!
 */
export function createMechanicalKeyboard3D({ accentHex = 0x38bdf8 } = {}) {
  const grp = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.38, 0.12, 0.86),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.24 })
  );
  base.position.y = 0.06;
  base.rotation.x = 0.06;
  grp.add(base);

  const underGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.30, 0.78),
    new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.35 })
  );
  underGlow.rotation.x = -Math.PI / 2;
  underGlow.position.y = 0.005;
  grp.add(underGlow);

  const cols = 14;
  const rows = 4;
  const total = cols * rows;
  const keyGeo = new THREE.BoxGeometry(0.132, 0.055, 0.132);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0.12 });
  const inst = new THREE.InstancedMesh(keyGeo, keyMat, total);

  const dummy = new THREE.Object3D();
  const cDark = new THREE.Color(0x0f172a);
  const cMid = new THREE.Color(0x334155);
  const cAccent = new THREE.Color(accentHex);
  const cWarn = new THREE.Color(0xf59e0b);

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -0.97 + c * 0.15;
      const z = -0.24 + r * 0.16;
      const y = 0.135 - z * 0.06;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0.06, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);

      if (r === 0 && c === 0) inst.setColorAt(idx, cWarn);
      else if (r === 3 && c >= 4 && c <= 9) inst.setColorAt(idx, cAccent);
      else if (c === 0 || c === cols - 1) inst.setColorAt(idx, cMid);
      else inst.setColorAt(idx, cDark);
      idx++;
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.computeBoundingSphere();
  grp.add(inst);

  return grp;
}

/**
 * 11. Orbital Halo Ring Backdrop (replaces blocking vertical bars with clean overhead & rear halo rings!)
 */
export function createOrbitalHaloRig({ goldHex = 0xfacc15, cyanHex = 0x38bdf8 } = {}) {
  const grp = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: goldHex,
    emissive: goldHex,
    emissiveIntensity: 0.25,
    metalness: 0.85,
    roughness: 0.2,
  });
  const cyanMat = new THREE.MeshBasicMaterial({ color: cyanHex, transparent: true, opacity: 0.72 });

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.045, 16, 96), goldMat);
  r1.rotation.x = Math.PI * 0.44;
  r1.position.set(0, 1.45, -2.2);
  grp.add(r1);

  const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.032, 14, 84), cyanMat);
  r2.rotation.x = Math.PI * 0.56;
  r2.rotation.y = 0.35;
  r2.position.set(0, 1.55, -2.2);
  grp.add(r2);

  const r3 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.025, 12, 96), goldMat);
  r3.rotation.x = Math.PI * 0.38;
  r3.rotation.y = -0.25;
  r3.position.set(0, 1.65, -2.6);
  grp.add(r3);

  return { group: grp, rings: [r1, r2, r3] };
}

