import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { updateSound } from '../audio/sound';
import { cutStop } from '../content/beats';
import { isSmallScreen, prefersReducedMotion } from '../lib/device';
import { LAUNCH_MS, useFlight } from '../state/store';
import { CameraRig } from './CameraRig';
import { Birds } from './Birds';
import { Clouds } from './Clouds';
import { cutAltitude, cutClock, fallEnd, landedAt, punchAt, RELAUNCH, riseAltitude, riseDuration, SLACK, SNAP, snapTime, veilAt } from './cutTimeline';
import { frame } from './frame';
import { Kite, RestingKite } from './Kite';
import { Lanterns } from './Lanterns';
import { Rain } from './Rain';
import { RivalKites } from './RivalKites';
import { Rooftops } from './Rooftops';
import { sampleSky, smoothstep } from './skyMath';
import { Sky } from './Sky';
import { Sparks } from './Sparks';
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

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, t))) - 1) / 2;

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
    frame.punch = 0;
    let desatTarget = 0;
    let rainTarget = 0;
    let gustTarget = s.phase === 'deciding' ? 1 : 0;

    if (s.cut && (s.phase === 'cut' || s.phase === 'relaunch')) {
      const stop = cutStop(s.cut.id);
      const snap = s.cut.id === 'snap';
      const t = cutClock(s.cut.id, (now - s.cut.startedAt) / 1000, reduced);
      const snapAt = snapTime(s.cut.id);

      if (s.phase === 'cut') {
        frame.cutT = t;
        next = cutAltitude(s.cut.id, t, reduced);
        frame.landed = landedAt(s.cut.id, t, reduced);
        if (reduced) frame.veil = veilAt(snapAt, t);
        if (!reduced && t < snapAt) {
          // Cut 1: the rival's string saws at Mihir's. Cut 2: the string strains harder and harder.
          if (snap && t > SNAP.cross) frame.shake = 1;
          if (!snap && t > SLACK.strain) frame.shake = 0.25 + 0.75 * smoothstep(SLACK.strain, snapAt, t);
        }
        // The snap itself: a hard jolt, and the camera punches in.
        if (!reduced && t >= snapAt && t < snapAt + 0.3) frame.shake = 2.2 * (1 - (t - snapAt) / 0.3);
        frame.punch = punchAt(s.cut.id, t, reduced);
        if (s.cut.step === 0 && t >= fallEnd(s.cut.id, reduced)) s.advanceCut();
        desatTarget = t > snapAt ? 1 : snap ? 0 : 0.35;
        rainTarget = snap && !reduced ? 1 : 0;
        // The stall is a storm of its own: the wind howls until the string gives.
        if (!snap && !reduced && t < snapAt + 0.4) gustTarget = smoothstep(0, SLACK.strain + 0.4, t);
        // The sky holds on the cut's chapter while the kite falls.
        frame.skyAltitude = stop.altitude;
      } else {
        const r = (now - (s.cut.relaunchAt ?? now)) / 1000;
        frame.relaunchT = r;
        next = riseAltitude(s.cut.id, r, reduced);
        // The camera comes down off the fallen kite to the parapet, where the new kite waits.
        frame.landed = reduced ? (r < 0.5 ? 1 : 0) : 1 - smoothstep(0, RELAUNCH.settle, r);
        if (reduced) frame.veil = veilAt(0, r);
        // Colour returns over 2 s; the sky moves on to the next chapter as the kite climbs.
        frame.skyAltitude =
          stop.altitude + ((next - stop.fallTo) / (stop.riseTo - stop.fallTo)) * (stop.riseTo - stop.altitude);
        if (r >= riseDuration(s.cut.id, reduced)) s.finishRelaunch();
      }
    } else {
      const launchT = s.launchedAt === null ? Infinity : now - s.launchedAt;
      if (launchT < LAUNCH_MS) {
        // "Hold to launch": the kite lifts off the parapet and climbs to the first card.
        next = s.targetAltitude * easeInOutSine(launchT / LAUNCH_MS);
      } else {
        next = altitude + (s.targetAltitude - altitude) * (1 - Math.exp(-dt * DAMPING));
        if (Math.abs(s.targetAltitude - next) < 0.01) next = s.targetAltitude;
      }
      frame.landed = 0;
      frame.skyAltitude = next;
    }
    // On the terrace before launch, and again for the relaunch after a cut: the kite
    // stands on the parapet and the camera looks up from the roof until it is well up.
    frame.perched = s.phase === 'intro' ? 1 : s.phase === 'cut' ? 0 : 1 - smoothstep(0.4, 9, next);

    frame.desat = ease(frame.desat, desatTarget, s.phase === 'relaunch' ? 1.6 : 2.5, dt);
    frame.rain = ease(frame.rain, rainTarget, 1.5, dt);
    frame.gust = ease(frame.gust, gustTarget, 1.6, dt);
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

/** Dev-only handle on the three.js scene, for checking the frame budget from the console. */
function DevHandle() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __scene: unknown }).__scene = scene;
  }, [scene]);
  return null;
}

/**
 * Keeps the flight smooth on slower devices: if the frame rate stays under
 * 40 fps for a few seconds, the canvas drops its pixel ratio, down to 1.
 */
function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr);
  const sample = useMemo(() => ({ frames: 0, time: 0 }), []);
  useFrame((state, delta) => {
    // Ignore long pauses, such as a hidden tab.
    if (delta > 0.5) return;
    sample.frames++;
    sample.time += delta;
    if (sample.time < 3) return;
    const fps = sample.frames / sample.time;
    sample.frames = 0;
    sample.time = 0;
    const dpr = state.viewport.dpr;
    if (fps < 40 && dpr > 1) setDpr(Math.max(1, dpr - 0.5));
  });
  return null;
}

/** Tells the page the scene is drawing, so "Hold to launch" can appear. */
function ReadySignal() {
  const frames = useMemo(() => ({ count: 0 }), []);
  useFrame(() => {
    // After two frames the shaders are compiled and the first picture is on screen.
    if (++frames.count === 2) useFlight.setState({ sceneReady: true });
  });
  return null;
}

/** Wind rises with altitude and gusts at decisions. */
function SoundDriver() {
  useFrame(() => updateSound(useFlight.getState().altitude, frame.gust));
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
      <SoundDriver />
      <AdaptiveResolution />
      <ReadySignal />
      {import.meta.env.DEV && <DevHandle />}
      <CameraRig />
      <Sky />
      <Clouds />
      <Lanterns />
      <Rooftops />
      <RivalKites />
      <Birds />
      <KiteString />
      <Kite />
      <Sparks />
      <RestingKite />
      <Rain />
      <Veil />
    </Canvas>
  );
}
