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
  /** Altitude the sky is drawn for. Holds on the cut's sky while the kite falls and climbs back. */
  skyAltitude: 0,
  /** 0 to 1. Sky colour drains during a cut and returns on relaunch. */
  desat: 0,
  /** 0 to 1. Full-screen fade used for cuts under reduced motion. */
  veil: 0,
  /** Seconds since the current cut began, or -1. */
  cutT: -1,
  /** Seconds since the relaunch began, or -1. */
  relaunchT: -1,
  /** 0 to 1. A cut kite is resting on the terrace. */
  landed: 0,
  /** 0 to 1. The kite is propped on the parapet before launch, and lifts off as it climbs. */
  perched: 1,
  /** 0 to 1. Short camera shake when the strings cross. */
  shake: 0,
  /** 0 to 1. Rain during Cut 1. */
  rain: 0,
  /** Point on the string where the rival kite crosses it (30% down from the kite). */
  crossPoint: new Vector3(),
  /** Where the string was cut, frozen at the snap. */
  cutPoint: new Vector3(),
  /** Kite position before sway, used by the camera. */
  kiteAnchor: new Vector3(),
  /** World position where the string meets the kite. */
  bridle: new Vector3(),
};
