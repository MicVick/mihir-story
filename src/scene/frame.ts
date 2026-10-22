// Per-frame values shared between scene components. Written by the driver,
// kite and camera each frame and read by the others, so nothing re-renders.

import { Vector3 } from 'three';
import { createSkySample } from './skyMath';

/** World units per metre of altitude. 900 m maps to 90 units. */
export const WORLD_PER_METRE = 0.1;

export const frame = {
  time: 0,
  /** Damped climb rate in metres per second. */
  climbRate: 0,
  sky: createSkySample(),
  /** 0 to 1. The wind gust while a decision is open. */
  gust: 0,
  /** -1 to 1. Brief drift toward the chosen side after a choice (A left, B right). */
  drift: 0,
  /** Kite position before sway, used by the camera. */
  kiteAnchor: new Vector3(),
  /** World position where the string meets the kite. */
  bridle: new Vector3(),
};
