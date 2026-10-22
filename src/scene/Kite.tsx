import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Euler, Vector3, type Group } from 'three';
import { cutStop } from '../content/beats';
import { kites } from '../content/palette';
import { prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { SLACK, SNAP } from './cutTimeline';
import { frame, WORLD_PER_METRE } from './frame';
import {
  BOTTOM,
  BRIDLE,
  createSailMaterial,
  createSparMaterial,
  sailGeometry,
  sparGeometry,
  tailGeometry,
} from './kiteModel';
import { smoothstep } from './skyMath';

/** A kite lying back on a terrace roof. */
const REST_ROTATION = new Euler(-1.2, 0, 0.35);
/** The fallen kite rests a little behind the flying plane, on the landing terrace. */
export const REST_Z = -3;
/** At Decision 4 the old kite rests on the left (option A) and the new one on the right (option B). */
const SIDE_X = 1.4;

type KiteParts = ReturnType<typeof createKiteParts>;

function createKiteParts() {
  return {
    sail: createSailMaterial(),
    tail: createSailMaterial(),
    spar: createSparMaterial(),
    sailGeometry: sailGeometry(),
    sparGeometry: sparGeometry(),
    tailGeometry: tailGeometry(),
  };
}

function useKiteParts(kiteId: 1 | 2 | 3, patch: boolean): KiteParts {
  const parts = useMemo(createKiteParts, []);
  useEffect(() => {
    const k = kites[kiteId];
    parts.sail.uniforms.uMain.value.set(k.main);
    parts.sail.uniforms.uSecond.value.set(k.second);
    parts.sail.uniforms.uPatch.value = patch ? 1 : 0;
    // The tail is a single colour: the second colour on both uniforms.
    parts.tail.uniforms.uMain.value.set(k.second);
    parts.tail.uniforms.uSecond.value.set(k.second);
  }, [kiteId, patch, parts]);
  useEffect(() => () => Object.values(parts).forEach((p) => p.dispose()), [parts]);
  return parts;
}

function setLight(parts: KiteParts) {
  const light = (1 - 0.45 * frame.sky.night) * (1 - 0.15 * frame.sky.overcast);
  parts.sail.uniforms.uLight.value = light;
  parts.tail.uniforms.uLight.value = light;
}

function KiteMesh({ parts, group, tail }: { parts: KiteParts; group?: RefObject<Group>; tail?: RefObject<Group> }) {
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

/** Wraps an angle to within half a turn of a reference, so a tumble settles the short way round. */
const nearestAngle = (angle: number, ref: number) =>
  ref + ((((angle - ref + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

/** Mihir's kite: flies, leans into gusts, tumbles or drifts down in a cut, rests on the roof, relaunches. */
export function Kite() {
  const group = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const kiteId = useFlight((s) => s.kite);
  // The old kite shows its patch once the two kites sit side by side for Decision 4.
  const patched = useFlight((s) => s.phase === 'cut' && s.cut?.id === 'slack' && s.cut.step >= 2);
  const parts = useKiteParts(kiteId, patched);
  const reduced = useMemo(prefersReducedMotion, []);
  const pose = useMemo(() => ({ pos: new Vector3(), rot: new Euler(), rest: new Vector3() }), []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const s = useFlight.getState();
    const t = frame.time;
    const amp = reduced ? 0.4 : 1;
    const ampX = amp * Math.min(1, state.size.width / state.size.height + 0.2);
    const lean = Math.min(1, Math.max(-1, frame.climbRate / 25));

    frame.kiteAnchor.set(0, s.altitude * WORLD_PER_METRE, 0);

    // Flying: sway, plus a gust that pushes the kite sideways and a drift toward the chosen side.
    const gust = frame.gust * amp * (0.9 + 0.35 * Math.sin(t * 1.7));
    const push = Math.min(1, ampX + 0.2) * (gust + 1.3 * frame.drift);
    const { pos, rot, rest } = pose;
    pos.set(
      push + ampX * (0.45 * Math.sin(t * 0.5) + 0.15 * Math.sin(t * 1.3 + 0.7)),
      frame.kiteAnchor.y + amp * 0.2 * Math.sin(t * 0.7 + 2),
      0,
    );
    rot.set(
      -0.2 - 0.15 * lean + amp * 0.05 * Math.sin(t * 1.1),
      amp * 0.15 * Math.sin(t * 0.6),
      amp * (0.12 * Math.sin(t * 0.9) + 0.05 * Math.sin(t * 2.3 + 1)) - 0.28 * gust - 0.3 * frame.drift,
    );

    // Falling: the snapped kite tumbles; the slack kite swings down like a leaf.
    const c = frame.cutT;
    if (c >= 0 && !reduced && s.cut) {
      if (s.cut.id === 'snap' && c > SNAP.snap) {
        const k = c - SNAP.snap;
        rot.z += k * 7;
        rot.x += Math.sin(k * 5) * 0.8;
        pos.x += Math.sin(k * 1.7) * 0.8;
      } else if (s.cut.id === 'slack') {
        const k = smoothstep(SLACK.fallStart, SLACK.fallStart + 1, c);
        pos.x += 1.6 * Math.sin(c * 1.3) * k;
        rot.z += 0.6 * Math.sin(c * 1.3) * k;
        rot.x += 0.3 * Math.sin(c * 0.9) * k;
      }
    }

    // Resting on the roof, blended in as the kite lands and out as the new kite lifts.
    const slack = s.cut?.id === 'slack';
    const restX = slack ? (s.phase === 'relaunch' ? SIDE_X : -SIDE_X) : 0;
    rest.set(restX, frame.kiteAnchor.y, REST_Z);
    const L = frame.landed;
    const spin = L > 0 ? nearestAngle(rot.z, REST_ROTATION.z) : rot.z;
    g.position.lerpVectors(pos, rest, L);
    g.rotation.set(
      rot.x + (REST_ROTATION.x - rot.x) * L,
      rot.y + (REST_ROTATION.y - rot.y) * L,
      spin + (REST_ROTATION.z - spin) * L,
    );
    if (tail.current) tail.current.rotation.z = amp * 0.35 * Math.sin(t * 3.1) * (1 - L);

    setLight(parts);
    g.updateMatrixWorld();
    frame.bridle.copy(BRIDLE).applyMatrix4(g.matrixWorld);
  }, -2);

  return <KiteMesh parts={parts} group={group} tail={tail} />;
}

/**
 * The second kite on the rooftop at Decision 4. While the visitor decides,
 * it is the new teal Kite 3 on the right. Once Kite 3 launches, the old
 * patched Kite 2 stays behind on the left.
 */
export function RestingKite() {
  const visible = useFlight(
    (s) => s.cut?.id === 'slack' && ((s.phase === 'cut' && s.cut.step >= 2) || s.phase === 'relaunch'),
  );
  const relaunching = useFlight((s) => s.phase === 'relaunch');
  const parts = useKiteParts(relaunching ? 2 : 3, relaunching);
  const y = cutStop('slack').fallTo * WORLD_PER_METRE;

  useFrame(() => setLight(parts));

  if (!visible) return null;
  return (
    <group position={[relaunching ? -SIDE_X : SIDE_X, y, REST_Z]} rotation={REST_ROTATION}>
      <KiteMesh parts={parts} />
    </group>
  );
}
