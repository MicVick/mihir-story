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
const LANDED_RISE = 3;
const LANDED_TILT = -0.15;
/** Before launch the camera stands on the terrace, close to the kite, looking up at a sky full of kites. */
const INTRO = {
  desktop: { distance: 9, eye: 1.5, tilt: 0.13 },
  mobile: { distance: 9, eye: 1.5, tilt: 0.13 },
};

/**
 * Follows the kite with a soft lag. Desktop keeps the kite left of centre
 * (cards take the right side); mobile keeps it in the upper middle (cards
 * sit in a bottom sheet). Field of view stays fixed. It follows closely
 * during cuts so the falling and relaunched kite stays in frame, shakes
 * briefly when the strings cross, and tilts up as the lanterns rise.
 */
export function CameraRig() {
  const ready = useRef(false);
  const lift = useRef(0);
  const base = useRef(new Vector3());

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const { phase, altitude } = useFlight.getState();
    const mobile = state.size.width <= MOBILE_MAX_WIDTH;
    const intro = mobile ? INTRO.mobile : INTRO.desktop;
    const P = frame.perched;
    // Pull back a little at decisions to show the gust and the bent string.
    const distance = DISTANCE + 2.5 * frame.gust + (intro.distance - DISTANCE) * P - 3.2 * frame.punch;
    const halfH = distance * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * (state.size.width / state.size.height);

    const anchor = frame.kiteAnchor;
    const tx = anchor.x + (mobile ? 0 : halfW * 0.36) * (1 - P);
    // On phones the kite rides higher at night, leaving room for the lanterns and their goals.
    const night = smoothstep(ENDING_ALTITUDE, ENDING_ALTITUDE + 15, altitude);
    const flyY = mobile ? anchor.y - halfH * (0.38 + 0.24 * night) : anchor.y - halfH * 0.05;
    // While a title or milestone is up, the camera lifts so the kite sits clear below the text.
    lift.current += (frame.momentLift - lift.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 1.8));
    const ty = flyY + (anchor.y + intro.eye - flyY) * P + LANDED_RISE * frame.landed + halfH * 0.24 * lift.current * (1 - P);
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
      intro.tilt * P +
      LANDED_TILT * frame.landed +
      (mobile ? 0 : ENDING_TILT * smoothstep(ENDING_ALTITUDE, MAX_ALTITUDE, altitude));
  }, -1);

  return null;
}
