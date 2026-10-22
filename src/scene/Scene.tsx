import { Canvas, useFrame } from '@react-three/fiber';
import { isSmallScreen } from '../lib/device';
import { useFlight } from '../state/store';
import { CameraRig } from './CameraRig';
import { Clouds } from './Clouds';
import { frame } from './frame';
import { Kite } from './Kite';
import { sampleSky, smoothstep } from './skyMath';
import { Sky } from './Sky';
import { KiteString } from './String';

/** Higher is snappier. The kite eases toward the target altitude so it never jumps. */
const DAMPING = 3.2;

/** Drift envelope after a choice: out to the chosen side, hold, then the wind recentres. */
function driftEnvelope(seconds: number): number {
  if (seconds < 0.45) return smoothstep(0, 0.45, seconds);
  if (seconds < 0.9) return 1;
  return 1 - smoothstep(0.9, 1.9, seconds);
}

/** Runs first each frame: damps altitude toward the input target, samples the sky, and eases the wind. */
function AltitudeDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const { altitude, targetAltitude, setAltitude, phase, lastChoice } = useFlight.getState();

    const gustTarget = phase === 'deciding' ? 1 : 0;
    frame.gust += (gustTarget - frame.gust) * (1 - Math.exp(-dt * 1.6));
    frame.drift = lastChoice
      ? (lastChoice.side === 'A' ? -1 : 1) * driftEnvelope((performance.now() - lastChoice.at) / 1000)
      : 0;

    let next = altitude + (targetAltitude - altitude) * (1 - Math.exp(-dt * DAMPING));
    if (Math.abs(targetAltitude - next) < 0.01) next = targetAltitude;

    const rate = dt > 0 ? (next - altitude) / dt : 0;
    frame.climbRate += (rate - frame.climbRate) * (1 - Math.exp(-dt * 4));
    frame.time += dt;
    sampleSky(next, frame.sky);
    if (next !== altitude) setAltitude(next);
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
      <KiteString />
      <Kite />
    </Canvas>
  );
}
