import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { SLACK, SNAP, snapTime } from './cutTimeline';
import { frame } from './frame';
import { smoothstep } from './skyMath';

const SEGMENTS = 48;
/** On-screen thickness of the string in CSS pixels. */
const WIDTH_PX = 1.6;
const DAY = new Color('#3d2b2b');
const NIGHT = new Color('#d9cfc2');
/** Where along the string (from the hand) the rival kite crosses it: 30% down from the kite. */
const CROSS_AT = 0.7;

function ribbonGeometry() {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array((SEGMENTS + 1) * 2 * 3), 3));
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(index);
  return g;
}

const p = new Vector3();
const q = new Vector3();
const offset = new Vector3();

/** Writes a camera-facing ribbon along the curve, WIDTH_PX wide on screen at every depth. */
function writeRibbon(geometry: BufferGeometry, curve: CatmullRomCurve3, camera: PerspectiveCamera, height: number) {
  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  const attr = geometry.getAttribute('position') as BufferAttribute;
  const arr = attr.array as Float32Array;
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    curve.getPoint(t, p);
    curve.getTangent(t, q);
    const dist = camera.position.z - p.z;
    const half = (WIDTH_PX * dist * 2 * tanHalf) / height / 2;
    const len = Math.hypot(q.x, q.y) || 1;
    const nx = (-q.y / len) * half;
    const ny = (q.x / len) * half;
    arr.set([p.x + nx, p.y + ny, p.z, p.x - nx, p.y - ny, p.z], i * 6);
  }
  attr.needsUpdate = true;
  geometry.computeBoundingSphere();
}

const points = (n: number) => Array.from({ length: n }, () => new Vector3());

/**
 * The manja: a Catmull-Rom curve from the flyer's hand (bottom centre of
 * the screen, just out of view) to the kite's bridle, drawn as a thin
 * ribbon that faces the camera. It sags when slack and pulls tight on a
 * climb. In both cuts it snaps into two falling pieces: at Cut 1 where the
 * rival's string crosses it, at Cut 2 after it strains and shakes in the wind.
 */
export function KiteString() {
  const reduced = useMemo(prefersReducedMotion, []);
  const parts = useMemo(() => {
    const material = new MeshBasicMaterial({ color: DAY.clone(), side: DoubleSide, transparent: true, opacity: 0.9 });
    const pieceMaterial = material.clone();
    const main = points(4);
    const kiteEnd = points(3);
    const handEnd = points(3);
    return {
      material,
      pieceMaterial,
      main: { geometry: ribbonGeometry(), points: main, curve: new CatmullRomCurve3(main) },
      kiteEnd: { geometry: ribbonGeometry(), points: kiteEnd, curve: new CatmullRomCurve3(kiteEnd) },
      handEnd: { geometry: ribbonGeometry(), points: handEnd, curve: new CatmullRomCurve3(handEnd) },
      tension: 0.5,
      wasSnapped: false,
    };
  }, []);

  useEffect(
    () => () => {
      [parts.main, parts.kiteEnd, parts.handEnd].forEach((r) => r.geometry.dispose());
      parts.material.dispose();
      parts.pieceMaterial.dispose();
    },
    [parts],
  );

  const mainMesh = useRef<Mesh>(null);
  const pieces = useRef<Group>(null);
  const show = (main: boolean, broken: boolean) => {
    if (mainMesh.current) mainMesh.current.visible = main;
    if (pieces.current) pieces.current.visible = broken;
  };

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const s = useFlight.getState();
    const c = frame.cutT;
    const cut = s.phase === 'cut' ? s.cut : null;
    const straining = cut?.id === 'slack' && c >= SLACK.strain && c < SLACK.snap ? smoothstep(SLACK.strain, SLACK.snap, c) : 0;
    const snapped = !!cut && c >= snapTime(cut.id);

    const handDepth = 5;
    const hand = parts.main.points[0];
    hand.set(camera.position.x, camera.position.y - handDepth * tanHalf * 1.25, camera.position.z - handDepth);

    parts.material.color.copy(DAY).lerp(NIGHT, frame.sky.night);
    parts.material.opacity = 0.9;
    parts.pieceMaterial.color.copy(parts.material.color);

    if (!snapped) {
      parts.wasSnapped = false;
      const [, mid1, mid2, kite] = parts.main.points;
      kite.copy(frame.bridle);
      // Tight while climbing, slack when still or descending, bar-tight as it strains in Cut 2.
      const target = straining > 0 ? 1 : Math.min(1, Math.max(0, 0.45 + frame.climbRate / 30));
      parts.tension += (target - parts.tension) * (1 - Math.exp(-Math.min(delta, 0.1) * (straining > 0 ? 8 : 3)));
      const length = hand.distanceTo(kite);
      const sag = length * 0.09 * (1 - 0.75 * parts.tension);
      mid1.lerpVectors(hand, kite, 0.35).y -= sag;
      mid2.lerpVectors(hand, kite, 0.7).y -= sag * 0.6;
      // Straining, the string thrums: a fast shiver that grows until it parts.
      const thrum = 0.06 * straining * Math.sin(frame.time * 70);
      mid1.y += thrum;
      mid2.y -= thrum * 0.8;
      // A gust bows the string sideways.
      const bend = length * 0.1 * frame.gust * (1 + 0.2 * Math.sin(frame.time * 1.3));
      mid1.x += bend;
      mid2.x += bend * 0.7;
      writeRibbon(parts.main.geometry, parts.main.curve, camera, state.size.height);
      parts.main.curve.getPoint(CROSS_AT, frame.crossPoint);
      show(true, false);
      return;
    }

    // Snapped. Under reduced motion the fade hides the break, so the pieces are not drawn.
    if (!parts.wasSnapped) {
      frame.cutPoint.copy(frame.crossPoint);
      parts.wasSnapped = true;
    }
    if (reduced) {
      show(false, false);
      return;
    }
    const k = c - snapTime(cut!.id);
    // The piece still tied to the kite trails above it as it falls.
    const [b0, b1, b2] = parts.kiteEnd.points;
    b0.copy(frame.bridle);
    b1.copy(b0).add(offset.set(-0.3 + 0.15 * Math.sin(k * 6), 1.0, 0));
    b2.copy(b0).add(offset.set(-0.1 + 0.3 * Math.sin(k * 5 + 1), 2.0, 0));
    writeRibbon(parts.kiteEnd.geometry, parts.kiteEnd.curve, camera, state.size.height);
    // The piece from the hand falls loose from the cut point.
    const [h0, h1, h2] = parts.handEnd.points;
    h0.copy(hand);
    h2.copy(frame.cutPoint).add(offset.set(0.4 * k, -1.5 * k * k, 0));
    h1.lerpVectors(h0, h2, 0.5).y -= 1.5;
    writeRibbon(parts.handEnd.geometry, parts.handEnd.curve, camera, state.size.height);
    const land = cut?.id === 'slack' ? SLACK.land : SNAP.land;
    parts.pieceMaterial.opacity = 0.9 * (1 - smoothstep(land - 1.2, land, c));
    show(false, true);
  });

  return (
    <>
      <mesh
        ref={mainMesh}
        geometry={parts.main.geometry}
        material={parts.material}
        frustumCulled={false}
      />
      <group ref={pieces} visible={false}>
        <mesh geometry={parts.kiteEnd.geometry} material={parts.pieceMaterial} frustumCulled={false} />
        <mesh geometry={parts.handEnd.geometry} material={parts.pieceMaterial} frustumCulled={false} />
      </group>
    </>
  );
}
