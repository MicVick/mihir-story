import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { isSmallScreen, prefersReducedMotion } from '../lib/device';
import { frame } from './frame';

const COUNT = 56;
const LIFE = 2.6;

/**
 * A milestone: gold sparks burst out from the kite, drift and fade. Fired by
 * the HTML layer through frame.celebrate, so nothing re-renders.
 */
export function Sparks() {
  const points = useRef<Points>(null);
  const state = useMemo(
    () => ({
      startedAt: 0,
      origin: new Vector3(),
      velocity: Array.from({ length: COUNT }, () => new Vector3()),
      delay: new Float32Array(COUNT),
    }),
    [],
  );
  const reduced = useMemo(prefersReducedMotion, []);

  const { geometry, material } = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(COUNT * 3), 3));
    geometry.setAttribute('aAlpha', new BufferAttribute(new Float32Array(COUNT), 1));
    geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(COUNT).map(() => 0.6 + Math.random() * 0.9), 1));
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uScale: { value: isSmallScreen() ? 26 : 34 } },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        attribute float aSize;
        uniform float uScale;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uScale * aSize / -mv.z * 10.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          // A soft dot with a small four-point glint.
          float core = smoothstep(0.5, 0.0, d);
          float glint = max(smoothstep(0.06, 0.0, abs(p.x)) , smoothstep(0.06, 0.0, abs(p.y))) * smoothstep(0.5, 0.1, d);
          float a = (core * core + 0.6 * glint) * vAlpha;
          gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * (0.8 + 0.4 * core), a);
        }`,
    });
    return { geometry, material };
  }, []);

  useFrame(() => {
    const p = points.current;
    if (!p) return;
    if (frame.celebrate !== state.startedAt) {
      state.startedAt = frame.celebrate;
      state.origin.copy(frame.bridle);
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = (reduced ? 0.6 : 1.6) + Math.random() * (reduced ? 0.8 : 2.4);
        state.velocity[i].set(Math.cos(a) * speed, Math.sin(a) * speed + 0.8, (Math.random() - 0.5) * 1.2);
        state.delay[i] = Math.random() * 0.35;
      }
    }
    const age = (performance.now() - state.startedAt) / 1000;
    const active = state.startedAt > 0 && age < LIFE + 0.4;
    p.visible = active;
    if (!active) return;

    const position = geometry.getAttribute('position') as BufferAttribute;
    const alpha = geometry.getAttribute('aAlpha') as BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const t = Math.max(0, age - state.delay[i]);
      // Fast out, slowing as if through air, then a gentle fall.
      const k = (1 - Math.exp(-t * 2.2)) / 2.2;
      const v = state.velocity[i];
      position.setXYZ(i, state.origin.x + v.x * k, state.origin.y + v.y * k - 0.35 * t * t, state.origin.z + v.z * k);
      const life = t / LIFE;
      const twinkle = 0.75 + 0.25 * Math.sin(t * 18 + i);
      alpha.setX(i, age < state.delay[i] ? 0 : Math.max(0, 1 - life) * twinkle);
    }
    position.needsUpdate = true;
    alpha.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} visible={false} />;
}
