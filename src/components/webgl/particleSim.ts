import * as THREE from 'three';
import { DoubleRenderTarget } from './fluid';

const simVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const simFragmentShader = `
  uniform sampler2D uCurrentPos;
  uniform sampler2D uOrigin;
  uniform sampler2D uFluidVelocity;
  uniform sampler2D uFluidDensity;
  uniform float uTime;
  uniform float uHZ;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uModelMatrix;
  uniform mat3 uCameraWorldRotation;

  varying vec2 vUv;

  vec3 rotateQuat(vec3 v, vec4 q) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
  }

  vec3 curlNoise(vec3 p) {
    float y1 = p.y * 1.3 + p.z * 0.9;
    float y2 = p.y * 2.7 - p.z * 1.8;
    float z1 = p.z * 1.4 + p.x * 0.8;
    float z2 = p.z * 2.5 - p.x * 2.1;
    float x1 = p.x * 1.2 + p.y * 1.1;
    float x2 = p.x * 2.4 - p.y * 1.9;

    float dPsi_x_dy = 1.3 * cos(y1) + 1.35 * cos(y2);
    float dPsi_x_dz = 0.9 * cos(y1) - 0.9 * cos(y2);
    float dPsi_y_dz = 1.4 * cos(z1) + 1.25 * cos(z2);
    float dPsi_y_dx = 0.8 * cos(z1) - 1.05 * cos(z2);
    float dPsi_z_dx = 1.2 * cos(x1) + 1.2 * cos(x2);
    float dPsi_z_dy = 1.1 * cos(x1) - 0.95 * cos(x2);

    vec3 curl = vec3(
      dPsi_z_dy - dPsi_y_dz,
      dPsi_x_dz - dPsi_z_dx,
      dPsi_y_dx - dPsi_x_dy
    );
    float l = length(curl);
    return l > 1e-5 ? curl / l : vec3(0.0);
  }

  float sdfShape(vec3 p) {
    if (length(p) > 0.8) return length(p) - 0.7;
    p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012);
    p = rotateQuat(p, vec4(0.5, 0.5, 0.5, 0.5));

    float angle = atan(p.y, p.x);
    float rMajor = 0.35 + 0.08 * sin(angle * 2.0 + p.z * 2.5) + 0.04 * cos(angle * 3.0);
    float rTube = 0.15 + 0.04 * sin(angle * 3.0 + 1.2) + 0.03 * cos(p.z * 4.5);

    vec2 qTorus = vec2(length(p.xy) - rMajor, p.z);
    float d = length(qTorus) - rTube;

    float lobes = 0.03 * (
      sin(p.x * 12.0) * cos(p.y * 12.0) +
      sin(p.y * 12.0) * cos(p.z * 12.0) +
      sin(p.z * 12.0) * cos(p.x * 12.0)
    );
    float opening = 0.05 * smoothstep(0.3, 1.8, abs(angle - 1.1));
    return d + lobes + opening;
  }

  vec3 sdfNormal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
      sdfShape(p + vec3(eps, 0.0, 0.0)) - sdfShape(p - vec3(eps, 0.0, 0.0)),
      sdfShape(p + vec3(0.0, eps, 0.0)) - sdfShape(p - vec3(0.0, eps, 0.0)),
      sdfShape(p + vec3(0.0, 0.0, eps)) - sdfShape(p - vec3(0.0, 0.0, eps))
    ));
  }

  void main() {
    vec3 pos = texture2D(uCurrentPos, vUv).xyz;
    vec3 origin = texture2D(uOrigin, vUv).xyz;

    if (length(pos) > 0.7) pos /= 2.0;
    pos += curlNoise(pos * 0.1 + uTime * 0.05) * 1.0 * 0.0002 * uHZ;

    vec3 gradient = sdfNormal(pos);
    float sdf = sdfShape(pos);

    vec3 normPos = length(pos) > 1e-4 ? normalize(pos) : vec3(0.0, 1.0, 0.0);
    vec3 normGrad = length(gradient) > 1e-4 ? normalize(gradient) : vec3(0.0, 1.0, 0.0);

    pos += cross(normPos, normGrad) * 0.0005;
    pos += -gradient * sdf * 0.5;
    pos += (origin - pos) * 0.0002 * uHZ;

    vec4 worldPos = uModelMatrix * vec4(pos, 1.0);
    vec4 clipPos = uProjectionMatrix * worldPos;
    vec2 screenUV = (clipPos.xy / clipPos.w) * 0.5 + 0.5;

    if (screenUV.x >= 0.0 && screenUV.x <= 1.0 && screenUV.y >= 0.0 && screenUV.y <= 1.0) {
      vec2 fVel = texture2D(uFluidVelocity, screenUV).xy;
      vec3 flow = uCameraWorldRotation * vec3(fVel, 0.0);
      float fDens = texture2D(uFluidDensity, screenUV).r;
      pos += flow * 0.0001 * uHZ * 0.4 * fDens;
    }

    gl_FragColor = vec4(pos, 1.0);
  }
`;

const pointVertexShader = `
  attribute vec4 random;
  uniform sampler2D uPosTex;
  uniform float uDPR;
  uniform float uTime;

  varying vec4 vRandom;
  varying float vScale;

  void main() {
    vRandom = random;
    vec3 pos = texture2D(uPosTex, position.xy).xyz;
    pos *= mix(1.0, 1.5, pow(random.y, 150.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float viewDist = -mvPosition.z;
    float scale = smoothstep(3.0, 15.0, viewDist) * mix(0.5, 1.0, random.z);
    vScale = scale;

    gl_PointSize = 0.04 * uDPR * 2.0 * scale * (1000.0 / max(viewDist, 0.01));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const pointFragmentShader = `
  uniform sampler2D uMatcap;
  uniform float uTime;
  varying vec4 vRandom;
  varying float vScale;

  vec3 blendSoftLight(vec3 b, vec3 s) {
    return mix(
      2.0 * b * s + b * b * (1.0 - 2.0 * s),
      sqrt(max(b, vec3(0.0))) * (2.0 * s - 1.0) + 2.0 * b * (1.0 - s),
      step(0.5, s)
    );
  }

  vec3 blendOverlay(vec3 b, vec3 s) {
    return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    if (vScale < 0.1) discard;

    vec3 grey = vec3(mix(0.0, 0.2, vRandom.x));
    vec3 cyanBlue = vec3(0.2, 0.75, 1.0);
    vec3 baseCol = mix(grey, cyanBlue, pow(vRandom.z, 100.0));

    float sparkle = 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5;
    vec3 col = baseCol * sparkle;

    float rotAngle = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
    mat2 rot = mat2(cos(rotAngle), -sin(rotAngle), sin(rotAngle), cos(rotAngle));
    vec2 matcapUV = rot * coord + vec2(0.5);
    vec3 matcapSample = texture2D(uMatcap, matcapUV).rgb;

    col = mix(col, blendSoftLight(col, matcapSample), 0.8);
    col = mix(col, blendOverlay(col, matcapSample), 0.2);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class ParticleSimulationSystem {
  size: number;
  count: number;
  pingPong: DoubleRenderTarget;
  originTexture: THREE.DataTexture;
  simScene: THREE.Scene;
  simCamera: THREE.OrthographicCamera;
  simMesh: THREE.Mesh;
  simMaterial: THREE.ShaderMaterial;
  pointsGeometry: THREE.BufferGeometry;
  pointsMaterial: THREE.ShaderMaterial;
  pointsMesh: THREE.Points;
  group: THREE.Group;

  constructor(isMobile: boolean, matcapTexture: THREE.CanvasTexture) {
    this.size = isMobile ? 128 : 512;
    this.count = this.size * this.size;

    const opts: THREE.RenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.pingPong = new DoubleRenderTarget(this.size, this.size, opts);

    const initialData = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      initialData[i * 4 + 0] = Math.random() * 2 - 1;
      initialData[i * 4 + 1] = Math.random() * 2 - 1;
      initialData[i * 4 + 2] = Math.random() * 2 - 1;
      initialData[i * 4 + 3] = 1.0;
    }
    this.originTexture = new THREE.DataTexture(initialData, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
    this.originTexture.needsUpdate = true;

    this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.simScene = new THREE.Scene();
    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      uniforms: {
        uCurrentPos: { value: this.originTexture },
        uOrigin: { value: this.originTexture },
        uFluidVelocity: { value: null },
        uFluidDensity: { value: null },
        uTime: { value: 0 },
        uHZ: { value: 1.0 },
        uProjectionMatrix: { value: new THREE.Matrix4() },
        uModelMatrix: { value: new THREE.Matrix4() },
        uCameraWorldRotation: { value: new THREE.Matrix3() },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMaterial);
    this.simScene.add(this.simMesh);

    this.pointsGeometry = new THREE.BufferGeometry();
    const posCoords = new Float32Array(this.count * 3);
    const randomVals = new Float32Array(this.count * 4);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const idx = y * this.size + x;
        posCoords[idx * 3 + 0] = (x + 0.5) / this.size;
        posCoords[idx * 3 + 1] = (y + 0.5) / this.size;
        posCoords[idx * 3 + 2] = 0;
        randomVals[idx * 4 + 0] = Math.random();
        randomVals[idx * 4 + 1] = Math.random();
        randomVals[idx * 4 + 2] = Math.random();
        randomVals[idx * 4 + 3] = Math.random();
      }
    }
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(posCoords, 3));
    this.pointsGeometry.setAttribute('random', new THREE.BufferAttribute(randomVals, 4));

    this.pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      uniforms: {
        uPosTex: { value: null },
        uMatcap: { value: matcapTexture },
        uDPR: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
        uTime: { value: 0 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.pointsMesh.frustumCulled = false;

    this.group = new THREE.Group();
    this.group.position.set(0.343, 0.16, -1);
    this.group.rotation.set((-28.4 * Math.PI) / 180, (390 * Math.PI) / 180, (4.92 * Math.PI) / 180);
    this.group.scale.set(5, 5, 6);
    this.group.add(this.pointsMesh);
  }

  initSimulation(renderer: THREE.WebGLRenderer) {
    this.simMaterial.uniforms.uCurrentPos.value = this.originTexture;
    this.simMesh.material = this.simMaterial;
    renderer.setRenderTarget(this.pingPong.read);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(null);
  }

  step(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, fluidVelTex: THREE.Texture, fluidDensTex: THREE.Texture, time: number, delta: number) {
    const HZ = Math.min(Math.max(delta * 60.0, 0.1), 3.0);
    const projMat = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const camRot = new THREE.Matrix3().setFromMatrix4(camera.matrixWorld);
    this.group.updateMatrixWorld(true);

    this.simMaterial.uniforms.uCurrentPos.value = this.pingPong.read.texture;
    this.simMaterial.uniforms.uOrigin.value = this.originTexture;
    this.simMaterial.uniforms.uFluidVelocity.value = fluidVelTex;
    this.simMaterial.uniforms.uFluidDensity.value = fluidDensTex;
    this.simMaterial.uniforms.uTime.value = time;
    this.simMaterial.uniforms.uHZ.value = HZ;
    this.simMaterial.uniforms.uProjectionMatrix.value = projMat;
    this.simMaterial.uniforms.uModelMatrix.value = this.group.matrixWorld;
    this.simMaterial.uniforms.uCameraWorldRotation.value = camRot;

    this.simMesh.material = this.simMaterial;
    renderer.setRenderTarget(this.pingPong.write);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(null);
    this.pingPong.swap();

    this.pointsMaterial.uniforms.uPosTex.value = this.pingPong.read.texture;
    this.pointsMaterial.uniforms.uTime.value = time;
  }

  dispose() {
    this.pingPong.dispose();
    this.originTexture.dispose();
    this.pointsGeometry.dispose();
    this.pointsMaterial.dispose();
  }
}