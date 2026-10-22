import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3, type PerspectiveCamera } from 'three';
import { ENDING_ALTITUDE, MAX_ALTITUDE } from '../content/beats';
import { useFlight } from '../state/store';
import { frame } from './frame';
import { smoothstep } from './skyMath';

const DISTANCE = 12;
/** Matches the CSS breakpoint where cards become a bottom sheet. */
const MOBILE_MAX_WIDTH = 768;
/** How far the camera tilts up to the night sky in the ending, in radians. */
const ENDING_TILT = 0.12;
/** While a cut kite rests on the roof, the camera rises and looks down at the terrace. */
const LANDED_RISE = 3.5;
const LANDED_TILT = -0.22;

/**
 * Follows the kite with a soft lag. Desktop keeps the kite left of centre
 * (cards take the right side); mobile keeps it in the upper middle (cards
 * sit in a bottom sheet). Field of view stays fixed. It follows closely
 * during cuts so the falling and relaunched kite stays in frame, shakes
 * briefly when the strings cross, and tilts up as the lanterns rise.
 */
export function CameraRig() {
  const ready = useRef(false);
  const base = useRef(new Vector3());

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const { phase, altitude } = useFlight.getState();
    // Pull back a little at decisions to show the gust and the bent string.
    const distance = DISTANCE + 2.5 * frame.gust;
    const halfH = distance * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * (state.size.width / state.size.height);
    const mobile = state.size.width <= MOBILE_MAX_WIDTH;

    const anchor = frame.kiteAnchor;
    const tx = mobile ? anchor.x : anchor.x + halfW * 0.36;
    const ty = (mobile ? anchor.y - halfH * 0.38 : anchor.y - halfH * 0.05) + LANDED_RISE * frame.landed;
    const b = base.current;

    // First frame, or a jump far enough that easing would lose the kite.
    if (!ready.current || Math.abs(ty - b.y) > halfH * 3) {
      b.set(tx, ty, distance);
      ready.current = true;
    } else {
      const rate = phase === 'cut' || phase === 'relaunch' ? 6 : 2.5;
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * rate);
      b.x += (tx - b.x) * k;
      b.y += (ty - b.y) * k;
      b.z = distance;
    }

    camera.position.copy(b);
    if (frame.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * 0.16 * frame.shake;
      camera.position.y += (Math.random() - 0.5) * 0.16 * frame.shake;
    }
    camera.rotation.x =
      LANDED_TILT * frame.landed + (mobile ? 0 : ENDING_TILT * smoothstep(ENDING_ALTITUDE, MAX_ALTITUDE, altitude));
  }, -1);

  return null;
}
