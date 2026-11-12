import * as THREE from 'three';

export interface MouseMotion {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  dx: number;
  dy: number;
  len: number;
  time: number;
}

export class DoubleRenderTarget {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;

  constructor(width: number, height: number, options: THREE.RenderTargetOptions) {
    this.read = new THREE.WebGLRenderTarget(width, height, options);
    this.write = new THREE.WebGLRenderTarget(width, height, options);
  }

  swap() {
    const temp = this.read;
    this.read = this.write;
    this.write = temp;
  }

  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

const baseVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const splatShader = `
  uniform sampler2D uTarget;
  uniform float uAspect;
  uniform vec2 uPoint0;
  uniform vec2 uPoint1;
  uniform vec3 uColor;
  uniform float uRadius;

  varying vec2 vUv;

  void main() {
    vec4 base = texture2D(uTarget, vUv);
    vec2 p = vUv;
    vec2 p0 = uPoint0;
    vec2 p1 = uPoint1;

    // Aspect corrected distance to line segment [p0, p1]
    vec2 pa = (p - p0) * vec2(uAspect, 1.0);
    vec2 ba = (p1 - p0) * vec2(uAspect, 1.0);
    float l = dot(ba, ba);
    float h = l > 1e-6 ? clamp(dot(pa, ba) / l, 0.0, 1.0) : 0.0;
    float d = length(pa - ba * h);

    float splat = exp(-d * d / max(uRadius * uRadius, 1e-6));
    gl_FragColor = base + vec4(uColor * splat, splat);
  }
`;

const curlShader = `
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;

  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float uCurlStrength;
  uniform float uDt;
  uniform vec2 uTexelSize;
  varying vec2 vUv;

  void main() {
    float L = texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    float len = length(force);
    if (len > 1e-5) {
      force = (force / len) * vec2(1.0, -1.0) * C * uCurlStrength;
    } else {
      force = vec2(0.0);
    }

    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * uDt, 0.0, 1.0);
  }
`;

const divergenceShader = `
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;

  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const pressureShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  uniform float uDissipation;
  varying vec2 vUv;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float div = texture2D(uDivergence, vUv).x;

    float p = (L + R + B + T - div) * 0.25 * uDissipation;
    gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy;

    vel -= 0.5 * vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const advectionShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  varying vec2 vUv;

  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 coord = vUv - uDt * vel * uTexelSize;
    vec4 result = texture2D(uSource, coord) * uDissipation;
    gl_FragColor = result;
  }
`;

export class GPUFluidSimulation {
  simRes = 256;
  dyeRes = 512;

  velocityDissipation = 0.98;
  densityDissipation = 0.97;
  pressureDissipation = 0.95;
  pressureIterations = 5;
  curlStrength = 30.0;
  dt = 1.0 / 60.0;

  velocity: DoubleRenderTarget;
  density: DoubleRenderTarget;
  curlTarget: THREE.WebGLRenderTarget;
  divergenceTarget: THREE.WebGLRenderTarget;
  pressure: DoubleRenderTarget;

  camera: THREE.OrthographicCamera;
  quadScene: THREE.Scene;
  quadMesh: THREE.Mesh;

  splatMat: THREE.ShaderMaterial;
  curlMat: THREE.ShaderMaterial;
  vorticityMat: THREE.ShaderMaterial;
  divergenceMat: THREE.ShaderMaterial;
  pressureMat: THREE.ShaderMaterial;
  gradientSubtractMat: THREE.ShaderMaterial;
  advectionMat: THREE.ShaderMaterial;

  lastSplatTime = 0;
  lastMouseX = 0;
  lastMouseY = 0;

  constructor() {
    const options: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };

    this.velocity = new DoubleRenderTarget(this.simRes, this.simRes, options);
    this.density = new DoubleRenderTarget(this.dyeRes, this.dyeRes, options);
    this.curlTarget = new THREE.WebGLRenderTarget(this.simRes, this.simRes, options);
    this.divergenceTarget = new THREE.WebGLRenderTarget(this.simRes, this.simRes, options);
    this.pressure = new DoubleRenderTarget(this.simRes, this.simRes, options);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(geo);
    this.quadScene.add(this.quadMesh);

    // Create materials for each pass
    this.splatMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: splatShader,
      uniforms: {
        uTarget: { value: null },
        uAspect: { value: 1.0 },
        uPoint0: { value: new THREE.Vector2() },
        uPoint1: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: 0.05 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.curlMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: curlShader,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.vorticityMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: vorticityShader,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        uCurlStrength: { value: this.curlStrength },
        uDt: { value: this.dt },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.divergenceMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: divergenceShader,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.pressureMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: pressureShader,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
        uDissipation: { value: this.pressureDissipation },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.gradientSubtractMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: gradientSubtractShader,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.advectionMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: advectionShader,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.simRes, 1 / this.simRes) },
        uDt: { value: this.dt },
        uDissipation: { value: 1.0 },
      },
      depthTest: false,
      depthWrite: false,
    });
  }

  splat(
    renderer: THREE.WebGLRenderer,
    p0: THREE.Vector2,
    p1: THREE.Vector2,
    color: THREE.Vector3,
    radius: number,
    aspect: number,
    target: DoubleRenderTarget
  ) {
    this.splatMat.uniforms.uTarget.value = target.read.texture;
    this.splatMat.uniforms.uAspect.value = aspect;
    this.splatMat.uniforms.uPoint0.value.copy(p0);
    this.splatMat.uniforms.uPoint1.value.copy(p1);
    this.splatMat.uniforms.uColor.value.copy(color);
    this.splatMat.uniforms.uRadius.value = radius;

    this.quadMesh.material = this.splatMat;
    renderer.setRenderTarget(target.write);
    renderer.render(this.quadScene, this.camera);
    target.swap();
  }

  step(
    renderer: THREE.WebGLRenderer,
    mouse: MouseMotion,
    aspect: number,
    isMobile: boolean
  ) {
    // 1. Mouse input: splat into velocity and density
    if (mouse.len > 0.01) {
      const now = performance.now();
      const timeSinceLast = now - this.lastSplatTime;

      // Splat radius = clamp-map(len, 0..5 -> 0..60) * 0.6 (* 0.8 on mobile)
      const mappedRadius = Math.min(Math.max(mouse.len / 5.0, 0.0), 1.0) * 60.0;
      const radiusBase = mappedRadius * 0.6 * (isMobile ? 0.8 : 1.0);
      const uvRadius = radiusBase / 200.0;

      // Force multiplier = clamp-map(len, 0..15 -> 0..10)
      const forceMult = Math.min(Math.max(mouse.len / 15.0, 0.0), 1.0) * 10.0;

      // UV points (in normalized 0..1 coordinates, invert Y for WebGL texture UV)
      const currentPoint = new THREE.Vector2(mouse.x, 1.0 - mouse.y);
      let prevPoint = new THREE.Vector2(mouse.prevX, 1.0 - mouse.prevY);

      if (timeSinceLast > 50) {
        prevPoint = currentPoint.clone();
      }

      this.lastSplatTime = now;

      // Velocity splat: colour (dx * mult, -dy * mult, 1)
      const velColor = new THREE.Vector3(
        mouse.dx * forceMult,
        -mouse.dy * forceMult,
        1.0
      );
      this.splat(
        renderer,
        prevPoint,
        currentPoint,
        velColor,
        uvRadius,
        aspect,
        this.velocity
      );

      // Density splat: white
      const dyeColor = new THREE.Vector3(1.0, 1.0, 1.0);
      this.splat(
        renderer,
        prevPoint,
        currentPoint,
        dyeColor,
        uvRadius,
        aspect,
        this.density
      );
    }

    // 2. Compute Curl from velocity
    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.quadMesh.material = this.curlMat;
    renderer.setRenderTarget(this.curlTarget);
    renderer.render(this.quadScene, this.camera);

    // 3. Vorticity Confinement
    this.vorticityMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMat.uniforms.uCurl.value = this.curlTarget.texture;
    this.vorticityMat.uniforms.uCurlStrength.value = this.curlStrength;
    this.vorticityMat.uniforms.uDt.value = this.dt;
    this.quadMesh.material = this.vorticityMat;
    renderer.setRenderTarget(this.velocity.write);
    renderer.render(this.quadScene, this.camera);
    this.velocity.swap();

    // 4. Divergence of velocity
    this.divergenceMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.quadMesh.material = this.divergenceMat;
    renderer.setRenderTarget(this.divergenceTarget);
    renderer.render(this.quadScene, this.camera);

    // 5. Pressure solve (5 Jacobi iterations)
    this.pressureMat.uniforms.uDivergence.value = this.divergenceTarget.texture;
    this.pressureMat.uniforms.uDissipation.value = this.pressureDissipation;
    for (let i = 0; i < this.pressureIterations; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.quadMesh.material = this.pressureMat;
      renderer.setRenderTarget(this.pressure.write);
      renderer.render(this.quadScene, this.camera);
      this.pressure.swap();
    }

    // 6. Subtract Pressure Gradient
    this.gradientSubtractMat.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientSubtractMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.quadMesh.material = this.gradientSubtractMat;
    renderer.setRenderTarget(this.velocity.write);
    renderer.render(this.quadScene, this.camera);
    this.velocity.swap();

    // 7. Advect Velocity
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uTexelSize.value.set(1 / this.simRes, 1 / this.simRes);
    this.advectionMat.uniforms.uDt.value = this.dt;
    this.advectionMat.uniforms.uDissipation.value = this.velocityDissipation;
    this.quadMesh.material = this.advectionMat;
    renderer.setRenderTarget(this.velocity.write);
    renderer.render(this.quadScene, this.camera);
    this.velocity.swap();

    // 8. Advect Density
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.density.read.texture;
    this.advectionMat.uniforms.uTexelSize.value.set(1 / this.dyeRes, 1 / this.dyeRes);
    this.advectionMat.uniforms.uDt.value = this.dt;
    this.advectionMat.uniforms.uDissipation.value = this.densityDissipation;
    this.quadMesh.material = this.advectionMat;
    renderer.setRenderTarget(this.density.write);
    renderer.render(this.quadScene, this.camera);
    this.density.swap();

    // Reset render target to canvas
    renderer.setRenderTarget(null);
  }

  dispose() {
    this.velocity.dispose();
    this.density.dispose();
    this.curlTarget.dispose();
    this.divergenceTarget.dispose();
    this.pressure.dispose();
    this.splatMat.dispose();
    this.curlMat.dispose();
    this.vorticityMat.dispose();
    this.divergenceMat.dispose();
    this.pressureMat.dispose();
    this.gradientSubtractMat.dispose();
    this.advectionMat.dispose();
    this.quadMesh.geometry.dispose();
  }
}
