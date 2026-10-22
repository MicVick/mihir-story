// Timings for the two cuts and the relaunch, in seconds. Pure functions of
// elapsed time, so the scene, the camera and the HTML layer stay in step.

import { cutStop, type CutId } from '../content/beats';
import { smoothstep } from './skyMath';

/** Cut 1: a rival kite crosses the string, "Kai po che!", the string snaps, the kite falls. */
export const SNAP = {
  /** The rival kite takes this long to reach the string. */
  cross: 1.5,
  /** The string snaps. */
  snap: 1.9,
  /** The kite comes to rest on the rooftops. */
  land: 5.4,
};

/** Cut 2: the string goes slack and the kite drifts down slowly. */
export const SLACK = {
  slack: 0.8,
  fallStart: 0.6,
  land: 6.6,
};

/** Under reduced motion the fall and the rise are a fade through the sky colour. */
const FADE = 0.5;

/** Accelerates like a fall, easing only slightly into the landing. */
const fallCurve = (t: number) => t * t * (2 - t);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** When the falling part ends and the cut's cards begin. */
export function fallEnd(id: CutId, reduced: boolean): number {
  if (id === 'snap') return reduced ? SNAP.snap + 2 * FADE : SNAP.land;
  return reduced ? SLACK.fallStart + 2 * FADE : SLACK.land;
}

/** Altitude during the cut, from the trigger altitude down to the rooftops. */
export function cutAltitude(id: CutId, t: number, reduced: boolean): number {
  const { altitude: from, fallTo: to } = cutStop(id);
  const start = id === 'snap' ? SNAP.snap : SLACK.fallStart;
  if (reduced) return t < start + FADE ? from : to;
  const end = fallEnd(id, false);
  const p = Math.min(1, Math.max(0, (t - start) / (end - start)));
  // The snapped kite drops faster and faster; the slack kite sinks gently.
  return from - (from - to) * (id === 'snap' ? fallCurve(p) : easeInOutSine(p));
}

/** 0 to 1 as the kite settles onto the roof at the end of the fall. */
export function landedAt(id: CutId, t: number, reduced: boolean): number {
  const end = fallEnd(id, reduced);
  return reduced ? (t >= end - FADE ? 1 : 0) : smoothstep(end - 0.6, end, t);
}

export function riseDuration(id: CutId, reduced: boolean): number {
  if (reduced) return 2 * FADE;
  const { fallTo, riseTo } = cutStop(id);
  return 2.5 + (riseTo - fallTo) / 150;
}

/** Altitude while the new kite climbs back to the next chapter. */
export function riseAltitude(id: CutId, t: number, reduced: boolean): number {
  const { fallTo, riseTo } = cutStop(id);
  if (reduced) return t < FADE ? fallTo : riseTo;
  const p = Math.min(1, t / riseDuration(id, false));
  return fallTo + (riseTo - fallTo) * easeInOutSine(p);
}

/** Opacity of the fade veil under reduced motion: in, cut to the new place, out. */
export function veilAt(start: number, t: number): number {
  return smoothstep(start, start + FADE, t) * (1 - smoothstep(start + FADE, start + 2 * FADE, t));
}
