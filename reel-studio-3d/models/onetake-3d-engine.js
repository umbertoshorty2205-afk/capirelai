/**
 * Capire l'AI — One-Take Continuous 3D Cinema World Engine (Skill 1: Ryanair / HyperFrames Style)
 *
 * Architettura:
 * - Un solo mondo 3D continuo lungo l'asse Z (z = 0 -> z = -88) con 4 ambienti fisici collegati:
 *   1. Gantry Hall (@CAPIRELAI) con pavimento blu notte + strisce gialle di sicurezza
 *   2. Nastro Trasportatore 3D animato con fila di box prompt generici bloccati
 *   3. Tunnel Scanner X-Ray con tendine nere flessibili + laser rossi pulsanti (la camera ci entra fisicamente!)
 *   4. Piazzale Stellato di Lancio + Cartellone Luminoso @CAPIRELAI + Jet/Razzo 3D in decollo
 * - Un solo Oggetto Eroe ("Il Filo"): Valigetta/Capsula 3D Rossa & Oro "PROMPT" che non esce mai di scena
 * - Vera Tipografia 3D Estrusa in scena (blocchi 3D con profondità, ombre, rotazione, spaccatura in 2 metà ed esplosione in schegge!)
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function setupOneTakeStudio(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.72;

  const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0b1120, 0.9);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 10, 8);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x38bdf8, 28, 30);
  rimLight.position.set(-3, 4, 2);
  scene.add(rimLight);

  const scannerLight = new THREE.PointLight(0xef4444, 0, 22);
  scannerLight.position.set(0, 2.5, -45);
  scene.add(scannerLight);

  return { keyLight, rimLight, scannerLight };
}

/**
 * Crea una parola 3D estrusa con spessore reale (frontale HD + spessore metallico/colorato 3D dietro)
 * Perfetta per atterrare nella scena 3D, viaggiare con la camera, o spaccarsi fisicamente!
 */
export function create3DWordBlock(renderer, {
  text,
  color = '#facc15',
  sideColor = 0xa16207,
  fontSize = 138,
  worldWidth = 4.2,
  depth = 0.28,
  bgGlow = false,
  splitHalves = false,
} = {}) {
  const buildSlab = (subText, subW) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${fontSize}px DisplaySans, LiberationSans, sans-serif`;

    // Thick dark outline + punchy bevel highlight for 3D cinema legibility
    ctx.lineJoin = 'round';
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeText(subText, 512, 134);

    if (bgGlow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
    }
    ctx.fillStyle = color;
    ctx.fillText(subText, 512, 134);

    // Subtle top specular highlight rim on letters
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText(subText, 512, 129);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const h = subW * (256 / 1024);
    const grp = new THREE.Group();

    // Multi-layer physical 3D extrusion stack (gives genuine thick 3D letter volume at every camera angle!)
    const layers = 7;
    const sideMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      color: sideColor,
      depthWrite: false,
      alphaTest: 0.15,
    });
    for (let i = 1; i <= layers; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(subW, h), sideMat);
      m.position.z = -(i / layers) * depth;
      grp.add(m);
    }

    const frontMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.15,
    });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(subW, h), frontMat);
    front.position.z = 0.005;
    grp.add(front);

    return grp;
  };

  const root = new THREE.Group();
  if (splitHalves) {
    const mid = Math.ceil(text.length / 2);
    const leftText = text.slice(0, mid);
    const rightText = text.slice(mid);
    const left = buildSlab(leftText, worldWidth * 0.56);
    const right = buildSlab(rightText, worldWidth * 0.56);
    left.position.x = -worldWidth * 0.22;
    right.position.x = worldWidth * 0.22;
    root.add(left, right);
    root.userData = { left, right, baseX: worldWidth * 0.22 };
  } else {
    root.add(buildSlab(text, worldWidth));
  }
  return root;
}

/**
 * Crea un gruppo di schegge 3D esplosive (per l'esplosione di "MAGICO" quando atterra "SCHERZO."!)
 */
export function createShardBurst(colorHex = 0xfacc15, count = 26) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.35,
    metalness: 0.5,
    roughness: 0.25,
  });
  const shards = [];
  for (let i = 0; i < count; i++) {
    const w = 0.12 + (i % 4) * 0.06;
    const h = 0.10 + ((i * 3) % 4) * 0.05;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), mat);
    const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.25;
    const spd = 1.6 + (i % 5) * 0.65;
    const vy = 1.2 + (i % 4) * 0.85;
    mesh.userData = {
      vx: Math.cos(ang) * spd,
      vy,
      vz: Math.sin(ang) * spd * 0.7,
      rx: (i % 2 === 0 ? 1 : -1) * (4 + (i % 4) * 2),
      ry: (i % 3 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
    };
    grp.add(mesh);
    shards.push(mesh);
  }
  grp.userData = { shards };
  grp.visible = false;
  return grp;
}

/**
 * L'OGGETTO EROE ("IL FILO"): Valigetta/Capsula 3D Rossa & Oro "PROMPT" di @capirelai
 * Resta sempre in scena e trascina fisicamente la camera da un ambiente all'altro!
 */
export function createHeroPromptCase(renderer) {
  const group = new THREE.Group();

  // Main rounded crimson suitcase / AI core case body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.42,
    roughness: 0.22,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.46, 0.54), bodyMat);
  group.add(body);

  // Ribbed industrial travel ridges (iconic hard-shell trolley silhouette!)
  const ribMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    metalness: 0.52,
    roughness: 0.28,
  });
  for (let i = -2; i <= 2; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.07, 0.58), ribMat);
    rib.position.y = i * 0.24;
    group.add(rib);
  }

  // Brushed metallic corner guards
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.16,
  });
  const handleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.62, 12), chromeMat);
  handleLeft.position.set(-0.24, 1.02, 0);
  const handleRight = handleLeft.clone();
  handleRight.position.x = 0.24;
  const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.10), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 }));
  handleTop.position.set(0, 1.32, 0);
  group.add(handleLeft, handleRight, handleTop);

  // 4 Spinner Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });
  const wheels = [];
  for (const [wx, wz] of [[-0.4, 0.18], [0.4, 0.18], [-0.4, -0.18], [0.4, -0.18]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 14), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, -0.80, wz);
    group.add(w);
    wheels.push(w);
  }

  // Glowing Front Badge ("PROMPT AI")
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, 480, 224);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AI PROMPT', 256, 108);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('22€ / MESE', 256, 184);
  const badgeTex = new THREE.CanvasTexture(c);
  badgeTex.colorSpace = THREE.SRGBColorSpace;
  badgeTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.42),
    new THREE.MeshBasicMaterial({ map: badgeTex })
  );
  badge.position.set(0, 0.06, 0.305);
  group.add(badge);

  // Golden Gift Ribbon (appears during the "finta promessa" beat, pops off on "SCHERZO."!)
  const ribbonGroup = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.3,
    metalness: 0.45,
    roughness: 0.25,
  });
  const ribV = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.54, 0.62), goldMat);
  const ribH = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.22, 0.62), goldMat);
  const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 22), goldMat);
  bowL.position.set(-0.22, 0.86, 0);
  bowL.rotation.z = 0.5;
  const bowR = bowL.clone();
  bowR.position.x = 0.22;
  bowR.rotation.z = -0.5;
  ribbonGroup.add(ribV, ribH, bowL, bowR);
  ribbonGroup.visible = false;
  group.add(ribbonGroup);

  return { group, ribbonGroup, wheels };
}

/**
 * Cartellone Luminoso Brand (@CAPIRELAI) in 3D (stile portale aeroportuale con lucine LED!)
 */
export function createBrandGantry(renderer, {
  label = '@CAPIRELAI',
  sub = 'CAPIRELAI.COM',
  width = 4.2,
  withLights = false,
} = {}) {
  const grp = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.78, roughness: 0.25 });
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 12), poleMat);
  poleL.position.set(-width * 0.46, 2.3, 0);
  const poleR = poleL.clone();
  poleR.position.x = width * 0.46;
  grp.add(poleL, poleR);

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, 28, 256);
  ctx.fillRect(996, 0, 28, 256);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 108px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 512, 114);
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 38px monospace';
  ctx.fillText(sub, 512, 198);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width, width * 0.25, 0.16),
    [
      poleMat, poleMat, poleMat, poleMat,
      new THREE.MeshBasicMaterial({ map: tex }),
      poleMat,
    ]
  );
  board.position.set(0, 4.15, 0);
  grp.add(board);

  if (withLights) {
    const bulbGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const colors = [0x38bdf8, 0xfacc15, 0x4ade80, 0xfb7185];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(
        bulbGeo,
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
      );
      m.position.set(-width * 0.48 + (i / 15) * width * 0.96, 4.15 + width * 0.145, 0.1);
      grp.add(m);
    }
  }
  return grp;
}

/**
 * Costruisce l'INTERO MONDO 3D CONTINUO (4 ambienti fisici lungo Z = 0 -> -88)
 */
export function buildContinuousWorld(renderer, scene) {
  const world = new THREE.Group();
  scene.add(world);

  // Continuous dark-cobalt airport/studio floor with bright yellow guide rails
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x071226,
    metalness: 0.45,
    roughness: 0.42,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 130), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -45);
  world.add(floor);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (const lx of [-2.4, 2.4]) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 120), lineMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(lx, 0.015, -45);
    world.add(stripe);
  }

  // ZONE 1 (z = 0..-12): Opening Gantry positioned cleanly ABOVE Beat 1 3D text!
  const startGantry = createBrandGantry(renderer, { label: '@CAPIRELAI', sub: 'ONE-TAKE 3D', width: 2.9, withLights: false });
  startGantry.position.set(0, 0.45, -11.5);
  world.add(startGantry);

  // Ambient glowing background bokeh pillars
  const bokehMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
  const warmMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.42 });
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (i % 3) * 0.07, 8, 8), i % 2 === 0 ? warmMat : bokehMat);
    s.position.set(
      (i % 2 === 0 ? -1 : 1) * (3.6 + (i % 5) * 1.1),
      1.2 + (i % 6) * 0.9,
      -2 - i * 2.1
    );
    world.add(s);
  }

  // ZONE 2 (z = -12..-36): Metallic Conveyor Belt + Jammed Generic Prompt Boxes
  const beltGroup = new THREE.Group();
  const beltBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.36, 26),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.78, roughness: 0.3 })
  );
  beltBase.position.set(0, 0.18, -24);
  beltGroup.add(beltBase);

  const beltRibs = [];
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.45 });
  for (let i = 0; i < 36; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.22), ribMat);
    r.position.set(0, 0.38, -11.5 - i * 0.72);
    beltGroup.add(r);
    beltRibs.push(r);
  }

  // Jammed generic robot boxes flanking the conveyor (representing 4 out of 5 generic users!)
  const jamColors = [0x38bdf8, 0x22c55e, 0xe879f9, 0xf59e0b];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -14.5 - i * 2.5;
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.35, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, wireframe: true })
    );
    cage.position.set(side * 1.95, 0.72, zPos);
    const jamBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 1.12, 0.46),
      new THREE.MeshStandardMaterial({
        color: jamColors[i % jamColors.length],
        metalness: 0.35,
        roughness: 0.3,
      })
    );
    jamBox.position.set(side * 1.95, 0.68, zPos);
    jamBox.rotation.z = side * 0.14;
    beltGroup.add(cage, jamBox);
  }
  world.add(beltGroup);

  // ZONE 3 (z = -38..-58): RED LASER X-RAY SCANNER TUNNEL + PHYSICAL BLACK RUBBER FLAPS!
  const scannerGroup = new THREE.Group();
  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x18090f,
    metalness: 0.75,
    roughness: 0.32,
  });
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 20), tunnelMat);
  wallL.position.set(-2.2, 2.2, -48);
  const wallR = wallL.clone();
  wallR.position.x = 2.2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 20), tunnelMat);
  roof.position.set(0, 4.4, -48);
  scannerGroup.add(wallL, wallR, roof);

  // Blazing Red Laser Interior Vertical Light Bars (13 rings deep!)
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff2a44 });
  const laserBars = [];
  for (let i = 0; i < 13; i++) {
    const zBar = -39.5 - i * 1.45;
    for (const sx of [-1.92, 1.92]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 3.8, 0.16), laserMat);
      bar.position.set(sx, 2.1, zBar);
      scannerGroup.add(bar);
      laserBars.push(bar);
    }
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.11, 0.16), laserMat);
    topBar.position.set(0, 4.05, zBar);
    scannerGroup.add(topBar);
    laserBars.push(topBar);
  }

  // Sweeping Red X-Ray Laser Sheet inside tunnel
  const laserPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 3.9),
    new THREE.MeshBasicMaterial({
      color: 0xff1e42,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    })
  );
  laserPlane.position.set(0, 2.1, -48);
  scannerGroup.add(laserPlane);

  // Physical Black Rubber Curtain Strips at Entry (z = -38.1) & Exit (z = -57.9)
  const flapMat = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.65, metalness: 0.2 });
  const entryFlaps = [];
  const exitFlaps = [];
  for (let i = 0; i < 7; i++) {
    const fx = -1.65 + i * 0.55;
    const fIn = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.9, 0.06), flapMat);
    fIn.position.set(fx, 2.15, -38.1);
    scannerGroup.add(fIn);
    entryFlaps.push(fIn);

    const fOut = fIn.clone();
    fOut.position.z = -57.9;
    scannerGroup.add(fOut);
    exitFlaps.push(fOut);
  }
  world.add(scannerGroup);

  // ZONE 4 (z = -60..-90): Starry Night Launchpad + Illuminated @CAPIRELAI Billboard + 3D Jet!
  const endGantry = createBrandGantry(renderer, { label: '@CAPIRELAI', sub: 'CAPIRELAI.COM', width: 3.6, withLights: true });
  endGantry.position.set(0, -0.75, -76);
  world.add(endGantry);

  // Sleek 3D Jet / Launch Vehicle soaring directly above the final billboard!
  const jetGroup = new THREE.Group();
  const jetBodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x334155, emissiveIntensity: 0.28, metalness: 0.55, roughness: 0.22 });
  const jetAccentMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.2 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4.6, 18), jetBodyMat);
  fuselage.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 18), jetAccentMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 2.85;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.11, 1.25), jetBodyMat);
  wings.position.set(0, -0.05, 0.2);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.35, 0.95), jetAccentMat);
  tailFin.position.set(0, 0.68, -1.85);
  const engL = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.9, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
  engL.rotation.x = Math.PI / 2;
  engL.position.set(-1.25, -0.25, 0.35);
  const engR = engL.clone();
  engR.position.x = 1.25;
  const flameL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), glowMat);
  flameL.position.set(-1.25, -0.25, 0.85);
  const flameR = flameL.clone();
  flameR.position.x = 1.25;
  jetGroup.add(fuselage, nose, wings, tailFin, engL, engR, flameL, flameR);
  jetGroup.scale.setScalar(0.75);
  jetGroup.position.set(0, 5.2, -82);
  world.add(jetGroup);

  // Starfield / Snow Sparkle Particles in Zone 4 sky
  const starCount = 320;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 32;
    starPos[i * 3 + 1] = 1.0 + Math.random() * 18;
    starPos[i * 3 + 2] = -55 - Math.random() * 48;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.11, transparent: true, opacity: 0.85 })
  );
  world.add(stars);

  return {
    world,
    beltRibs,
    laserPlane,
    entryFlaps,
    exitFlaps,
    endGantry,
    jetGroup,
    stars,
  };
}
