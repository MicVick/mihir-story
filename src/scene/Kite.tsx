import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
} from 'three';
import { kites } from '../content/palette';
import { prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { frame, WORLD_PER_METRE } from './frame';

// Kite-local points. The kite faces +z (the camera); wing tips bow back.
const TOP = [0, 0.8, 0];
const LEFT = [-0.62, 0.12, -0.12];
const RIGHT = [0.62, 0.12, -0.12];
const BOTTOM = [0, -0.8, 0];
const CENTRE = [0, 0.1, 0];
const BRIDLE = new Vector3(0, 0.05, 0.25);

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

  void main() {
    // Patang pattern: a small diamond near the top and the bottom tip in the second colour.
    float inner = abs(vLocal.x) / 0.24 + abs(vLocal.y - 0.36) / 0.3;
    float second = max(step(inner, 1.0), step(vLocal.y, -0.48));
    vec3 col = mix(uMain, uSecond, second);
    float paper = 0.93 + 0.07 * noise(vLocal * 38.0);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float shade = 0.8 + 0.2 * max(dot(n, normalize(vec3(0.3, 0.6, 1.0))), 0.0);
    gl_FragColor = vec4(col * paper * shade * uLight, 1.0);
    #include <colorspace_fragment>
  }
`;

function sailGeometry() {
  const tris = [TOP, LEFT, CENTRE, TOP, CENTRE, RIGHT, LEFT, BOTTOM, CENTRE, CENTRE, BOTTOM, RIGHT];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

function sparGeometry() {
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

function tailGeometry() {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, -0.16, -0.28, 0, 0.16, -0.28, 0], 3));
  return g;
}

export function Kite() {
  const group = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const kiteId = useFlight((s) => s.kite);
  const reduced = useMemo(prefersReducedMotion, []);

  const parts = useMemo(() => {
    const sail = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      uniforms: {
        uMain: { value: new Color() },
        uSecond: { value: new Color() },
        uLight: { value: 1 },
      },
    });
    return {
      sail,
      sailGeometry: sailGeometry(),
      sparGeometry: sparGeometry(),
      tailGeometry: tailGeometry(),
      spar: new LineBasicMaterial({ color: '#5a3b22' }),
      tail: new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: DoubleSide,
        uniforms: { uMain: { value: new Color() }, uSecond: { value: new Color() }, uLight: { value: 1 } },
      }),
    };
  }, []);

  useEffect(() => {
    const k = kites[kiteId];
    parts.sail.uniforms.uMain.value.set(k.main);
    parts.sail.uniforms.uSecond.value.set(k.second);
    // The tail is a single colour: the second colour on both uniforms.
    parts.tail.uniforms.uMain.value.set(k.second);
    parts.tail.uniforms.uSecond.value.set(k.second);
  }, [kiteId, parts]);

  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => p.dispose());
    },
    [parts],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = frame.time;
    const amp = reduced ? 0.4 : 1;
    const ampX = amp * Math.min(1, state.size.width / state.size.height + 0.2);
    const altitude = useFlight.getState().altitude;
    const lean = Math.min(1, Math.max(-1, frame.climbRate / 25));

    frame.kiteAnchor.set(0, altitude * WORLD_PER_METRE, 0);
    // A gust pushes the kite sideways and it leans into it; after a choice it drifts to that side.
    const gust = frame.gust * amp * (0.9 + 0.35 * Math.sin(t * 1.7));
    const push = Math.min(1, ampX + 0.2) * (gust + 1.3 * frame.drift);
    g.position.set(
      push + ampX * (0.45 * Math.sin(t * 0.5) + 0.15 * Math.sin(t * 1.3 + 0.7)),
      frame.kiteAnchor.y + amp * 0.2 * Math.sin(t * 0.7 + 2),
      0,
    );
    g.rotation.set(
      -0.2 - 0.15 * lean + amp * 0.05 * Math.sin(t * 1.1),
      amp * 0.15 * Math.sin(t * 0.6),
      amp * (0.12 * Math.sin(t * 0.9) + 0.05 * Math.sin(t * 2.3 + 1)) - 0.28 * gust - 0.3 * frame.drift,
    );
    if (tail.current) tail.current.rotation.z = amp * 0.35 * Math.sin(t * 3.1);

    const light = (1 - 0.45 * frame.sky.night) * (1 - 0.15 * frame.sky.overcast);
    parts.sail.uniforms.uLight.value = light;
    parts.tail.uniforms.uLight.value = light;

    g.updateMatrixWorld();
    frame.bridle.copy(BRIDLE).applyMatrix4(g.matrixWorld);
  }, -2);

  return (
    <group ref={group}>
      <mesh geometry={parts.sailGeometry} material={parts.sail} />
      <lineSegments geometry={parts.sparGeometry} material={parts.spar} />
      <group ref={tail} position={[BOTTOM[0], BOTTOM[1] + 0.02, 0]}>
        <mesh geometry={parts.tailGeometry} material={parts.tail} />
      </group>
    </group>
  );
}
