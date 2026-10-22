import { Canvas, useFrame } from '@react-three/fiber';
import { isSmallScreen } from '../lib/device';
import { useFlight } from '../state/store';
import { CameraRig } from './CameraRig';
import { Clouds } from './Clouds';
import { frame } from './frame';
import { Kite } from './Kite';
import { sampleSky } from './skyMath';
import { Sky } from './Sky';
import { KiteString } from './String';

/** Higher is snappier. The kite eases toward the target altitude so it never jumps. */
const DAMPING = 3.2;

/** Runs first each frame: damps altitude toward the input target and samples the sky. */
function AltitudeDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const { altitude, targetAltitude, setAltitude } = useFlight.getState();
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
