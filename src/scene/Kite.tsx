import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Euler, Vector3, type Group } from 'three';
import { cutStop, kiteFor } from '../content/beats';
import { chapters } from '../content/story';
import { kites } from '../content/palette';
import { prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { SLACK, snapTime, tugAt } from './cutTimeline';
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
import { COPING_TOP, LANDING_TOP, PARAPET_Z } from './Rooftops';
import { smoothstep } from './skyMath';

/** A fallen kite lying on the terrace floor, a little in front of the parapet. */
const FALLEN_ROTATION = new Euler(-1.42, 0, 0.42);
const FALLEN = new Vector3(0, LANDING_TOP + 0.08, 1.6);
/** A kite waiting for launch, standing on the parapet's coping, leaning back a little. */
const PERCHED_ROTATION = new Euler(-0.22, 0.1, 0.04);
const PERCHED = new Vector3(0, COPING_TOP + 0.78, PARAPET_Z);
/** In a cut the fallen kite lies on the left and the next kite waits on the right. */
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
    parts.sail.uniforms.uPattern.value = k.pattern;
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

/** Mihir's kite: flies, leans into gusts, tumbles down in a cut, rests on the roof, relaunches from the parapet. */
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

    // Falling: once the string parts, the kite tumbles. In the stall it first fights a hard
    // wind, jerking against the string, until the string gives.
    const c = frame.cutT;
    if (c >= 0 && !reduced && s.cut) {
      const snap = snapTime(s.cut.id);
      if (c > snap) {
        const k = c - snap;
        rot.z += k * 7;
        rot.x += Math.sin(k * 5) * 0.8;
        pos.x += Math.sin(k * 1.7) * 0.8;
      } else if (s.cut.id === 'slack') {
        const k = smoothstep(SLACK.strain, snap, c);
        pos.x += k * (0.5 + 0.25 * Math.sin(c * 23));
        pos.y += k * 0.12 * Math.sin(c * 31);
        rot.z += k * (-0.45 + 0.22 * Math.sin(c * 19));
      }
    }

    // On the terrace: propped against the parapet before launch and while the next kite
    // waits, or lying where it fell. Blended in as the kite lands and out as it lifts.
    let weight = frame.perched;
    let restRot = PERCHED_ROTATION;
    let tug = 0;
    rest.copy(PERCHED);
    if (s.phase === 'cut' && s.cut) {
      weight = frame.landed;
      restRot = FALLEN_ROTATION;
      rest.copy(FALLEN).setX(-SIDE_X);
    } else if (s.phase === 'relaunch') {
      // The new kite stands on the parapet beside the old one, takes a few tugs, and lifts off.
      rest.setX(SIDE_X);
      tug = tugAt(frame.relaunchT, reduced);
      rest.y += 0.28 * tug;
      rest.z += 0.12 * tug;
    }
    const spin = weight > 0 ? nearestAngle(rot.z, restRot.z) : rot.z;
    g.position.lerpVectors(pos, rest, weight);
    g.rotation.set(
      rot.x + (restRot.x - rot.x) * weight,
      rot.y + (restRot.y - rot.y) * weight,
      spin + (restRot.z - spin) * weight,
    );
    // Each tug tips the kite back into the wind.
    g.rotation.x -= 0.35 * tug;
    if (tail.current) tail.current.rotation.z = amp * 0.35 * Math.sin(t * 3.1) * (1 - weight);

    setLight(parts);
    g.updateMatrixWorld();
    frame.bridle.copy(BRIDLE).applyMatrix4(g.matrixWorld);
  }, -2);

  return <KiteMesh parts={parts} group={group} tail={tail} />;
}

/**
 * The other kite on the terrace during a cut. Once the cut's cards are read,
 * the next kite waits against the parapet on the right: Kite 2 beside the
 * Re-tie button, the new teal Kite 3 at Decision 4. When it launches, the
 * old kite stays behind, lying where it fell (Kite 2 with its patch).
 */
export function RestingKite() {
  const cut = useFlight((s) => s.cut);
  const phase = useFlight((s) => s.phase);
  const cutsDone = useFlight((s) => s.cutsDone);

  // Snap: with the last card and its Re-tie button. Slack: with Decision 4, after the stall card.
  const chapter = cut ? chapters[cutStop(cut.id).chapter] : undefined;
  const ready = chapter ? chapter.cards.length + (chapter.decision ? 1 : 0) : 0;
  const waiting = phase === 'cut' && cut !== null && cut.step >= ready;
  const fallen = phase === 'relaunch' && cut !== null;
  // While waiting, the kite after this cut; once launched, the kite that fell.
  const done = fallen ? cutsDone.filter((id) => id !== cut.id) : cut ? [...cutsDone, cut.id] : cutsDone;
  const kiteId = kiteFor(done);
  const parts = useKiteParts(kiteId, fallen && cut?.id === 'slack');

  useFrame(() => setLight(parts));

  if (!waiting && !fallen) return null;
  return fallen ? (
    <group position={[-SIDE_X, FALLEN.y, FALLEN.z]} rotation={FALLEN_ROTATION}>
      <KiteMesh parts={parts} />
    </group>
  ) : (
    <group position={[SIDE_X, PERCHED.y, PERCHED.z]} rotation={PERCHED_ROTATION}>
      <KiteMesh parts={parts} />
    </group>
  );
}
