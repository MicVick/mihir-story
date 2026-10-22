import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { frame } from './frame';

const SEGMENTS = 48;
/** On-screen thickness of the string in CSS pixels. */
const WIDTH_PX = 1.6;
const DAY = new Color('#3d2b2b');
const NIGHT = new Color('#d9cfc2');

/**
 * The manja: a Catmull-Rom curve from the flyer's hand (bottom centre of
 * the screen, just out of view) to the kite's bridle, drawn as a thin
 * ribbon that faces the camera. It sags when slack and pulls tight on a climb.
 */
export function KiteString() {
  const { geometry, material, curve, points } = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array((SEGMENTS + 1) * 2 * 3), 3));
    const index: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setIndex(index);
    const pts = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    return {
      geometry: g,
      material: new MeshBasicMaterial({ color: DAY.clone(), side: DoubleSide, transparent: true, opacity: 0.9 }),
      curve: new CatmullRomCurve3(pts),
      points: pts,
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const scratch = useMemo(() => ({ p: new Vector3(), q: new Vector3(), tension: 0.5 }), []);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const [hand, mid1, mid2, kite] = points;

    const handDepth = 5;
    hand.set(camera.position.x, camera.position.y - handDepth * tanHalf * 1.25, camera.position.z - handDepth);
    kite.copy(frame.bridle);

    // Tight while climbing, slack when still or descending.
    const target = Math.min(1, Math.max(0, 0.45 + frame.climbRate / 30));
    scratch.tension += (target - scratch.tension) * (1 - Math.exp(-Math.min(delta, 0.1) * 3));
    const sag = hand.distanceTo(kite) * 0.09 * (1 - 0.75 * scratch.tension);
    mid1.lerpVectors(hand, kite, 0.35).y -= sag;
    mid2.lerpVectors(hand, kite, 0.7).y -= sag * 0.6;

    const attr = geometry.getAttribute('position') as BufferAttribute;
    const arr = attr.array as Float32Array;
    const { p, q } = scratch;
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      curve.getPoint(t, p);
      curve.getTangent(t, q);
      // Ribbon width so the string is WIDTH_PX on screen at every depth.
      const dist = camera.position.z - p.z;
      const half = (WIDTH_PX * dist * 2 * tanHalf) / state.size.height / 2;
      const len = Math.hypot(q.x, q.y) || 1;
      const nx = (-q.y / len) * half;
      const ny = (q.x / len) * half;
      arr.set([p.x + nx, p.y + ny, p.z, p.x - nx, p.y - ny, p.z], i * 6);
    }
    attr.needsUpdate = true;
    geometry.computeBoundingSphere();

    material.color.copy(DAY).lerp(NIGHT, frame.sky.night);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
