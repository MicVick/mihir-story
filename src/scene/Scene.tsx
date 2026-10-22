import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { cutStop } from '../content/beats';
import { isSmallScreen, prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { CameraRig } from './CameraRig';
import { Clouds } from './Clouds';
import { cutAltitude, fallEnd, landedAt, riseAltitude, riseDuration, SNAP, SLACK, veilAt } from './cutTimeline';
import { frame } from './frame';
import { Kite, RestingKite } from './Kite';
import { Lanterns } from './Lanterns';
import { Rain } from './Rain';
import { RivalKites } from './RivalKites';
import { Rooftops } from './Rooftops';
import { sampleSky, smoothstep } from './skyMath';
import { Sky } from './Sky';
import { KiteString } from './String';
import { Veil } from './Veil';

/** Higher is snappier. The kite eases toward the target altitude so it never jumps. */
const DAMPING = 3.2;

/** Drift envelope after a choice: out to the chosen side, hold, then the wind recentres. */
function driftEnvelope(seconds: number): number {
  if (seconds < 0.45) return smoothstep(0, 0.45, seconds);
  if (seconds < 0.9) return 1;
  return 1 - smoothstep(0.9, 1.9, seconds);
}

const ease = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-dt * rate));

/**
 * Runs first each frame. In free flight it damps altitude toward the input
 * target; during a cut or relaunch it plays the scripted fall and climb.
 * It also samples the sky and eases the wind, colour and fade values.
 */
function AltitudeDriver() {
  const reduced = useMemo(prefersReducedMotion, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = useFlight.getState();
    const now = performance.now();
    const { altitude } = s;
    let next = altitude;

    frame.cutT = -1;
    frame.relaunchT = -1;
    frame.veil = 0;
    frame.shake = 0;
    let desatTarget = 0;
    let rainTarget = 0;

    if (s.cut && (s.phase === 'cut' || s.phase === 'relaunch')) {
      const stop = cutStop(s.cut.id);
      const snap = s.cut.id === 'snap';
      const t = (now - s.cut.startedAt) / 1000;

      if (s.phase === 'cut') {
        frame.cutT = t;
        next = cutAltitude(s.cut.id, t, reduced);
        frame.landed = landedAt(s.cut.id, t, reduced);
        if (reduced) frame.veil = veilAt(snap ? SNAP.snap : SLACK.fallStart, t);
        if (snap && !reduced && t > SNAP.cross && t < SNAP.snap) frame.shake = 1;
        if (s.cut.step === 0 && t >= fallEnd(s.cut.id, reduced)) s.advanceCut();
        desatTarget = snap ? (t > SNAP.snap ? 1 : 0) : 0.5;
        rainTarget = snap && !reduced ? 1 : 0;
        // The sky holds on the cut's chapter while the kite falls.
        frame.skyAltitude = stop.altitude;
      } else {
        const r = (now - (s.cut.relaunchAt ?? now)) / 1000;
        frame.relaunchT = r;
        next = riseAltitude(s.cut.id, r, reduced);
        frame.landed = reduced ? (r < 0.5 ? 1 : 0) : 1 - smoothstep(0, 0.6, r);
        if (reduced) frame.veil = veilAt(0, r);
        // Colour returns over 2 s; the sky moves on to the next chapter as the kite climbs.
        frame.skyAltitude =
          stop.altitude + ((next - stop.fallTo) / (stop.riseTo - stop.fallTo)) * (stop.riseTo - stop.altitude);
        if (r >= riseDuration(s.cut.id, reduced)) s.finishRelaunch();
      }
    } else {
      next = altitude + (s.targetAltitude - altitude) * (1 - Math.exp(-dt * DAMPING));
      if (Math.abs(s.targetAltitude - next) < 0.01) next = s.targetAltitude;
      frame.landed = 0;
      frame.skyAltitude = next;
    }

    frame.desat = ease(frame.desat, desatTarget, s.phase === 'relaunch' ? 1.6 : 2.5, dt);
    frame.rain = ease(frame.rain, rainTarget, 1.5, dt);
    frame.gust = ease(frame.gust, s.phase === 'deciding' ? 1 : 0, 1.6, dt);
    frame.drift = s.lastChoice
      ? (s.lastChoice.side === 'A' ? -1 : 1) * driftEnvelope((now - s.lastChoice.at) / 1000)
      : 0;

    const rate = dt > 0 ? (next - altitude) / dt : 0;
    frame.climbRate = ease(frame.climbRate, rate, 4, dt);
    frame.time += dt;
    sampleSky(frame.skyAltitude, frame.sky);
    if (next !== altitude) s.setAltitude(next);
  }, -3);
  return null;
}

export function Scene() {
  return (
    <Canvas
      flat
      dpr={[1, isSmallScreen() ? 1.5 : 2]}
      camera={{ fov: 50, near: 0.1, far: 400, position: [0, 0, 12] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <AltitudeDriver />
      <CameraRig />
      <Sky />
      <Clouds />
      <Lanterns />
      <Rooftops />
      <RivalKites />
      <KiteString />
      <Kite />
      <RestingKite />
      <Rain />
      <Veil />
    </Canvas>
  );
}
