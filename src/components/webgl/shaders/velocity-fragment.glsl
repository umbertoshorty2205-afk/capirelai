// Velocity Fragment Shader - GPGPU Particle Physics
// Outputs velocity for ping-pong rendering

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float time;
uniform float deltaTime;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float bounds;
uniform float ringRadius;
uniform float tubeRadius;

varying vec2 vUv;

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.11369, 0.13787));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float noise3d(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec3 a = hash33(i);
  vec3 b = hash33(i + vec3(1,0,0));
  vec3 c = hash33(i + vec3(0,1,0));
  vec3 d = hash33(i + vec3(1,1,0));
  vec3 e = hash33(i + vec3(0,0,1));
  vec3 f3 = hash33(i + vec3(1,0,1));
  vec3 g = hash33(i + vec3(0,1,1));
  vec3 h = hash33(i + vec3(1,1,1));
  return mix(mix(mix(a.x, b.x, f.x), mix(c.x, d.x, f.x), f.y),
             mix(mix(e.x, f3.x, f.x), mix(g.x, h.x, f.y), f.z), f.z);
}

void main() {
  vec4 posData = texture2D(positionTexture, vUv);
  vec4 velData = texture2D(velocityTexture, vUv);

  vec3 position = posData.xyz;
  vec3 velocity = velData.xyz;

  // Mouse interaction - fluid dynamics
  vec2 screenPos = position.xy;
  vec2 toMouse = mousePosition - screenPos;
  float distToMouse = length(toMouse);

  if (distToMouse < mouseInfluence && mouseInfluence > 0.0) {
    float influence = 1.0 - distToMouse / mouseInfluence;
    influence = influence * influence * influence;

    vec2 perp = vec2(-toMouse.y, toMouse.x);
    velocity.xy += (toMouse * 0.03 + perp * 0.04) * influence * deltaTime * 60.0;
  }

  // Apply velocity with damping
  position += velocity * deltaTime * 60.0;
  velocity *= 0.993;

  // Boundary conditions
  float b = bounds;
  if (abs(position.x) > b) {
    position.x = -sign(position.x) * b;
    velocity.x *= -0.7;
  }
  if (abs(position.y) > b) {
    position.y = -sign(position.y) * b;
    velocity.y *= -0.7;
  }
  if (abs(position.z) > b) {
    position.z = -sign(position.z) * b;
    velocity.z *= -0.7;
  }

  // Flow field noise
  float n1 = noise3d(position * 2.0 + time * 0.15);
  float n2 = noise3d(position * 1.5 - time * 0.1);
  float n3 = noise3d(position * 3.0 + time * 0.07);
  velocity += vec3(n1, n2, n3) * 0.002 * deltaTime * 60.0;

  // Ring/torus attractor
  float rDist = length(vec2(length(position.xz) - ringRadius, position.y));

  if (rDist < tubeRadius * 2.5) {
    vec3 ringCenter = normalize(vec3(
      position.x * (1.0 - ringRadius / max(0.001, length(position.xz))),
      0.0,
      position.z * (1.0 - ringRadius / max(0.001, length(position.xz)))
    ));

    vec3 toSurface = vec3(ringCenter.x, position.y, ringCenter.z) - position;
    float ringForce = 1.0 - rDist / (tubeRadius * 2.5);
    velocity += toSurface * ringForce * 0.015 * deltaTime * 60.0;

    vec3 tangent = normalize(vec3(-position.z, 0.0, position.x));
    velocity += tangent * 0.01 * deltaTime * 60.0;
  }

  // Velocity dispersion
  float disp = noise3d(position * 5.0 + time * 0.5);
  velocity += normalize(velocity + 0.001) * disp * 0.0005 * deltaTime * 60.0;

  // Output velocity (RGB) and keep position in alpha for reference
  gl_FragColor = vec4(velocity, 1.0);
}