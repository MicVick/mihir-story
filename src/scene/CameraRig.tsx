import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { frame } from './frame';

const DISTANCE = 12;
/** Matches the CSS breakpoint where cards become a bottom sheet. */
const MOBILE_MAX_WIDTH = 768;

/**
 * Follows the kite with a soft lag. Desktop keeps the kite left of centre
 * (cards take the right side); mobile keeps it in the upper middle (cards
 * sit in a bottom sheet). Field of view stays fixed.
 */
export function CameraRig() {
  const ready = useRef(false);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    // Pull back a little at decisions to show the gust and the bent string.
    const distance = DISTANCE + 2.5 * frame.gust;
    const halfH = distance * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * (state.size.width / state.size.height);
    const mobile = state.size.width <= MOBILE_MAX_WIDTH;

    const anchor = frame.kiteAnchor;
    const tx = mobile ? anchor.x : anchor.x + halfW * 0.36;
    const ty = mobile ? anchor.y - halfH * 0.38 : anchor.y - halfH * 0.05;

    // First frame, or a jump far enough that easing would lose the kite.
    if (!ready.current || Math.abs(ty - camera.position.y) > halfH * 3) {
      camera.position.set(tx, ty, distance);
      ready.current = true;
    } else {
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * 2.5);
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z = distance;
    }
  }, -1);

  return null;
}
