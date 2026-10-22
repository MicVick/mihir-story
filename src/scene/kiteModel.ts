// The patang, built in code: a bowed diamond sail with a paper-noise
// shader, two spars and a small tail. Shared by Mihir's kite, the kite
// resting on the roof and the rival kites.

import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
} from 'three';

// Kite-local points. The kite faces +z (the camera); wing tips bow back.
const TOP = [0, 0.8, 0];
const LEFT = [-0.62, 0.12, -0.12];
const RIGHT = [0.62, 0.12, -0.12];
export const BOTTOM = [0, -0.8, 0];
const CENTRE = [0, 0.1, 0];
/** Where the string ties on, in kite-local space. */
export const BRIDLE = new Vector3(0, 0.05, 0.25);

const vertexShader = /* glsl */ `
  varying vec2 vLocal;
  varying vec3 vNormal;
  void main() {
    vLocal = position.xy;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uMain;
  uniform vec3 uSecond;
  uniform float uLight;
  uniform float uPatch;
  uniform float uAlpha;
  uniform float uPattern;
  varying vec2 vLocal;
  varying vec3 vNormal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
  }

  void main() {
    vec2 p = vLocal;
    vec2 T = vec2(${TOP[0]}, ${TOP[1]});
    vec2 L = vec2(${LEFT[0]}, ${LEFT[1]});
    vec2 R = vec2(${RIGHT[0]}, ${RIGHT[1]});
    vec2 B = vec2(${BOTTOM[0]}, ${BOTTOM[1]});
    float edge = min(min(segment(p, T, L), segment(p, T, R)), min(segment(p, L, B), segment(p, B, R)));
    float aa = fwidth(p.x) * 1.5;

    // Traditional patang patterns, all with the bottom tip in the second colour.
    // 0: a small diamond near the top. 1: a moon (chaand) in the centre. 2: a cap above the bow.
    float tip = smoothstep(-0.48 + aa, -0.48 - aa, p.y);
    float shape;
    if (uPattern < 0.5) {
      float inner = abs(p.x) / 0.24 + abs(p.y - 0.36) / 0.3;
      shape = smoothstep(1.0 + aa * 4.0, 1.0 - aa * 4.0, inner);
    } else if (uPattern < 1.5) {
      shape = smoothstep(0.2 + aa, 0.2 - aa, length(p - vec2(0.0, 0.08)));
    } else {
      shape = smoothstep(0.34 - aa, 0.34 + aa, p.y + 0.12 * abs(p.x));
    }
    vec3 col = mix(uMain, uSecond, max(shape, tip));

    // A paper patch on the left wing, with a darker stitched edge.
    vec2 q = abs(vLocal - vec2(-0.26, -0.02));
    float box = max(q.x, q.y);
    col = mix(col, vec3(0.93, 0.88, 0.78), uPatch * step(box, 0.12));
    col = mix(col, col * 0.6, uPatch * step(0.105, box) * step(box, 0.12) * step(0.5, fract((vLocal.x + vLocal.y) * 30.0)));

    // The paper is folded over a thin thread at the edge and glued: a darker border.
    col = mix(col, col * 0.7, smoothstep(0.022 + aa, 0.022 - aa, edge));
    // Light passes through the paper: a soft glow toward the top, slightly darker at the edges.
    col *= 0.9 + 0.1 * smoothstep(0.0, 0.2, edge);
    col *= 0.95 + 0.09 * smoothstep(-0.8, 0.8, p.y);

    float paper = 0.94 + 0.06 * noise(vLocal * 38.0);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float shade = 0.84 + 0.16 * max(dot(n, normalize(vec3(0.3, 0.6, 1.0))), 0.0);
    gl_FragColor = vec4(col * paper * shade * uLight, uAlpha);
    #include <colorspace_fragment>
  }
`;

export function createSailMaterial(transparent = false) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: DoubleSide,
    transparent,
    depthWrite: !transparent,
    uniforms: {
      uMain: { value: new Color() },
      uSecond: { value: new Color() },
      uLight: { value: 1 },
      uPatch: { value: 0 },
      uAlpha: { value: 1 },
      uPattern: { value: 0 },
    },
  });
}

export function sailGeometry() {
  const tris = [TOP, LEFT, CENTRE, TOP, CENTRE, RIGHT, LEFT, BOTTOM, CENTRE, CENTRE, BOTTOM, RIGHT];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

export function sparGeometry() {
  const bow = new QuadraticBezierCurve3(
    new Vector3(LEFT[0], LEFT[1], LEFT[2] + 0.01),
    new Vector3(0, 0.3, 0.06),
    new Vector3(RIGHT[0], RIGHT[1], RIGHT[2] + 0.01),
  ).getPoints(16);
  const points: number[] = [];
  for (let i = 0; i < bow.length - 1; i++) points.push(...bow[i].toArray(), ...bow[i + 1].toArray());
  points.push(TOP[0], TOP[1], 0.01, BOTTOM[0], BOTTOM[1], 0.01);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(points, 3));
  return g;
}

export function tailGeometry() {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, -0.16, -0.28, 0, 0.16, -0.28, 0], 3));
  g.computeVertexNormals();
  return g;
}

export const createSparMaterial = () => new LineBasicMaterial({ color: '#6b4a2e', transparent: true, opacity: 0.85 });
