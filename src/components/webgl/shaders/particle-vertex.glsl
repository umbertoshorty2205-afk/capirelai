// Particle Vertex Shader - GPGPU Simulation
// Simulates 262,144 particles with GPU fluid dynamics responding to mouse

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float time;
uniform float deltaTime;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float pointSize;

varying vec3 vPosition;
varying vec3 vVelocity;
varying float vSpeed;
varying vec3 vColor;

void main() {
  // Get particle index from UV coordinates
  vec2 uv = uv;
  vec4 posData = texture2D(positionTexture, uv);
  vec4 velData = texture2D(velocityTexture, uv);

  vec3 position = posData.xyz;
  vec3 velocity = velData.xyz;

  // Calculate speed for color mapping
  float speed = length(velocity);
  vSpeed = speed;

  // Mouse interaction - fluid dynamics
  vec2 screenPos = position.xy;
  vec2 toMouse = mousePosition - screenPos;
  float distToMouse = length(toMouse);

  // Fluid-like attraction/repulsion based on mouse
  if (distToMouse < mouseInfluence) {
    float influence = 1.0 - distToMouse / mouseInfluence;
    influence = influence * influence; // Quadratic falloff

    // Vorticity for fluid-like swirling
    vec2 perp = vec2(-toMouse.y, toMouse.x) * 0.5;
    velocity.xy += (toMouse * 0.02 + perp * 0.03) * influence * deltaTime * 60.0;
  }

  // Apply velocity with damping
  position += velocity * deltaTime * 60.0;
  velocity *= 0.995; // Slight damping for stability

  // Boundary conditions - wrap around with fluid-like behavior
  float bounds = 1.5;
  if (abs(position.x) > bounds) {
    position.x = -sign(position.x) * bounds;
    velocity.x *= -0.8;
  }
  if (abs(position.y) > bounds) {
    position.y = -sign(position.y) * bounds;
    velocity.y *= -0.8;
  }
  if (abs(position.z) > bounds) {
    position.z = -sign(position.z) * bounds;
    velocity.z *= -0.8;
  }

  // Add subtle noise-based flow field
  float noise = sin(position.x * 3.0 + time * 0.5) * cos(position.y * 3.0 + time * 0.3) *
                sin(position.z * 2.0 + time * 0.2);
  velocity += vec3(noise, -noise, noise * 0.5) * 0.001 * deltaTime * 60.0;

  // Ring formation - attract particles to torus shape
  float ringRadius = 0.8;
  float tubeRadius = 0.3;
  float ringDist = length(vec2(length(position.xz) - ringRadius, position.y));

  if (ringDist < tubeRadius * 2.0) {
    vec3 toRingCenter = normalize(vec3(
      position.x * (1.0 - ringRadius / max(0.001, length(position.xz))),
      position.y,
      position.z * (1.0 - ringRadius / max(0.001, length(position.xz)))
    ));
    float ringForce = 1.0 - ringDist / (tubeRadius * 2.0);
    velocity += toRingCenter * ringForce * 0.01 * deltaTime * 60.0;
  }

  vPosition = position;
  vVelocity = velocity;

  // Color based on speed and position (brand colors for CapirelAI)
  float hue = 0.55 + speed * 0.3 + position.y * 0.1; // Teal to cyan range
  vec3 color = vec3(0.0);
  float h = hue * 6.0;
  float f = fract(h);
  float p = 0.2;
  float q = 0.2 + 0.6 * (1.0 - f);
  float t = 0.2 + 0.6 * f;

  if (h < 1.0) color = vec3(0.8, q, p);
  else if (h < 2.0) color = vec3(t, 0.8, p);
  else if (h < 3.0) color = vec3(p, 0.8, q);
  else if (h < 4.0) color = vec3(p, t, 0.8);
  else if (h < 5.0) color = vec3(q, p, 0.8);
  else color = vec3(0.8, p, t);

  // Boost brightness based on speed
  color *= 0.5 + speed * 2.0;

  // Add ring glow
  if (ringDist < tubeRadius) {
    float glow = 1.0 - ringDist / tubeRadius;
    color += vec3(0.0, 0.8, 1.0) * glow * 0.5;
  }

  vColor = color;

  // Output position for GPGPU feedback
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize * (1.0 + speed * 2.0) * (1.0 / -gl_Position.z) * 100.0;
}