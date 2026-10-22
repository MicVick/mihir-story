import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, PerspectiveCamera } from 'three';
import { useFlight } from '../state/store';
import { frame } from './frame';
import { seeded } from './wrap';

const COUNT = 8;
const DEPTH = -20;
/** Seconds to cross the screen. */
const CROSSING = 16;
/** The flock crosses once in each of these chapters. */
const CHAPTERS = [1, 2];

/** A small flock of V-shaped birds that crosses the sky once in Chapters 1 and 2. */
export function Birds() {
  const lines = useRef<LineSegments>(null);
  const flight = useRef<{ start: number; chapter: number } | null>(null);
  const crossed = useRef(new Set<number>());

  const parts = useMemo(() => {
    const rand = seeded(31);
    // A loose V formation, the leader in front.
    const birds = Array.from({ length: COUNT }, (_, i) => {
      const rank = Math.ceil(i / 2);
      const side = i % 2 === 0 ? 1 : -1;
      return {
        x: -rank * 1.1 + (rand() - 0.5) * 0.4,
        y: side * rank * 0.55 + (rand() - 0.5) * 0.3,
        phase: rand() * Math.PI * 2,
        size: 0.22 + rand() * 0.08,
      };
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(COUNT * 4 * 3), 3));
    const material = new LineBasicMaterial({ color: '#3a3f4b', transparent: true, opacity: 0.7 });
    return { birds, geometry, material };
  }, []);

  useEffect(
    () => () => {
      parts.geometry.dispose();
      parts.material.dispose();
    },
    [parts],
  );

  useFrame((state) => {
    const l = lines.current;
    if (!l) return;
    const chapter = useFlight.getState().chapterIndex;
    if (!flight.current && CHAPTERS.includes(chapter) && !crossed.current.has(chapter)) {
      crossed.current.add(chapter);
      flight.current = { start: frame.time, chapter };
    }
    const f = flight.current;
    const t = f ? (frame.time - f.start) / CROSSING : 1;
    if (!f || t >= 1) {
      flight.current = null;
      l.visible = false;
      return;
    }
    l.visible = true;
    const camera = state.camera as PerspectiveCamera;
    const dist = camera.position.z - DEPTH;
    const halfH = dist * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * (state.size.width / state.size.height);
    // Left to right, high in the frame, rising gently.
    const cx = camera.position.x - halfW - 4 + (2 * halfW + 8) * t;
    const cy = camera.position.y + halfH * 0.55 + t * 1.5;
    const attr = parts.geometry.getAttribute('position') as BufferAttribute;
    parts.birds.forEach((b, i) => {
      const x = cx + b.x;
      const y = cy + b.y;
      const flap = Math.sin(frame.time * 7 + b.phase) * b.size * 0.7;
      const s = b.size;
      attr.setXYZ(i * 4, x - s, y + flap, DEPTH);
      attr.setXYZ(i * 4 + 1, x, y, DEPTH);
      attr.setXYZ(i * 4 + 2, x, y, DEPTH);
      attr.setXYZ(i * 4 + 3, x + s, y + flap, DEPTH);
    });
    attr.needsUpdate = true;
    parts.material.opacity = 0.7 * Math.min(1, t * 8, (1 - t) * 8);
  });

  return <lineSegments ref={lines} geometry={parts.geometry} material={parts.material} frustumCulled={false} visible={false} />;
}
