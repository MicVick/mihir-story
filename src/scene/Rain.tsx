import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, PerspectiveCamera } from 'three';
import { isSmallScreen } from '../lib/device';
import { frame } from './frame';
import { seeded, wrap } from './wrap';

const LENGTH = 0.5;
const SLANT = 0.12;
const SPEED = 18;

/** Light rain during Cut 1 only. Never drawn under reduced motion (the driver keeps it at 0). */
export function Rain() {
  const lines = useRef<LineSegments>(null);

  const parts = useMemo(() => {
    const rand = seeded(5);
    const count = isSmallScreen() ? 130 : 260;
    const drops = Array.from({ length: count }, () => ({ x: (rand() - 0.5) * 60, y: rand() * 60, z: -2 - rand() * 23 }));
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
    return { drops, geometry, material: new LineBasicMaterial({ color: '#dfe6ee', transparent: true, opacity: 0 }) };
  }, []);

  useEffect(
    () => () => {
      parts.geometry.dispose();
      parts.material.dispose();
    },
    [parts],
  );

  useFrame((state, delta) => {
    const l = lines.current;
    if (!l) return;
    l.visible = frame.rain > 0.01;
    if (!l.visible) return;
    const camera = state.camera as PerspectiveCamera;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = state.size.width / state.size.height;
    parts.material.opacity = 0.35 * frame.rain;
    const attr = parts.geometry.getAttribute('position') as BufferAttribute;
    const dt = Math.min(delta, 0.1);
    parts.drops.forEach((d, i) => {
      d.y -= SPEED * dt;
      d.x -= SPEED * SLANT * dt;
      const dist = camera.position.z - d.z;
      const x = wrap(d.x, camera.position.x, dist * tanHalf * aspect + 1);
      const y = wrap(d.y, camera.position.y, dist * tanHalf + 1);
      attr.setXYZ(i * 2, x, y, d.z);
      attr.setXYZ(i * 2 + 1, x + LENGTH * SLANT, y + LENGTH, d.z);
    });
    attr.needsUpdate = true;
  });

  return <lineSegments ref={lines} geometry={parts.geometry} material={parts.material} frustumCulled={false} visible={false} />;
}
