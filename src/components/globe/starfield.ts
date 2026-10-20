// Adapted from the starfield technique in frontend.txt (a scroll-driven
// hero section) — only the star-shader idea is reused here, not the
// nebula/mountains/bloom/scroll-camera machinery, which doesn't fit a
// fixed dashboard panel. Injected directly into the globe's own Three.js
// scene (via GlobeMethods.scene()) rather than a second WebGL canvas —
// react-globe.gl already renders every frame, so this costs nothing extra
// beyond one more Points mesh; a second renderer/context would have been
// real GPU/memory cost this machine can't spare (see earlier memory-limit
// issues during local builds).
import * as THREE from "three";

const VERTEX_SHADER = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float time;

  void main() {
    vColor = color;
    vec3 pos = position;

    float angle = time * 0.015;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xz = rot * pos.xz;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vColor, opacity);
  }
`;

export interface Starfield {
  points: THREE.Points;
  dispose: () => void;
  setTime: (t: number) => void;
}

/**
 * A star shell around the globe. `innerRadius`/`outerRadius` should clear
 * the globe's own radius (100 units in react-globe.gl's default scale) so
 * stars never render inside/through the globe surface.
 */
export function createStarfield(
  count = 1400,
  innerRadius = 300,
  outerRadius = 900,
): Starfield {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Mostly white, a few warm/cool tints — matches the reference's mix.
    const roll = Math.random();
    if (roll < 0.75) color.setHSL(0, 0, 0.85 + Math.random() * 0.15);
    else if (roll < 0.9) color.setHSL(0.09, 0.4, 0.8);
    else color.setHSL(0.58, 0.4, 0.8);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 1.6 + 0.4;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1; // always drawn behind the globe/markers

  return {
    points,
    setTime: (t: number) => {
      material.uniforms.time.value = t;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
