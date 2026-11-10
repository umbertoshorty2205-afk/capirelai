// Particle Fragment Shader - GPGPU Simulation
// Renders particles with additive blending for glow effects

varying vec3 vPosition;
varying vec3 vVelocity;
varying float vSpeed;
varying vec3 vColor;

void main() {
  // Circular point with soft edges
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft circular falloff
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

  // Add inner glow
  float innerGlow = 1.0 - smoothstep(0.0, 0.25, dist);

  // Combine color with glow
  vec3 finalColor = vColor * (alpha + innerGlow * 0.5);
  float finalAlpha = alpha * (0.3 + vSpeed * 1.5);

  // Additive blending for particle glow effect
  gl_FragColor = vec4(finalColor, finalAlpha);
}