// Timings for the two cuts and the relaunch, in seconds. Pure functions of
// elapsed time, so the scene, the camera and the HTML layer stay in step.

import { cutStop, type CutId } from '../content/beats';
import { RELAUNCH, SLACK, SNAP, snapTime } from './cutTimes';
import { smoothstep } from './skyMath';

export { RELAUNCH, SLACK, SNAP, snapTime };

/** Both cuts slow down as the string parts (1.2 s at 30% speed), then the fall runs at full speed. */
const SLOW = { real: 1.2, rate: 0.3 };

/**
 * Story time for a cut, from real seconds since it began. Every timing in
 * this file is in story time, so the slow motion reaches the kite, the
 * string, the camera and the cards alike.
 */
export function cutClock(id: CutId, t: number, reduced: boolean): number {
  const snap = snapTime(id);
  if (reduced || t <= snap) return t;
  if (t < snap + SLOW.real) return snap + (t - snap) * SLOW.rate;
  return snap + SLOW.real * SLOW.rate + (t - snap - SLOW.real);
}

/** 0 to 1. The camera pushes in hard at the snap and eases back out as the kite falls. */
export function punchAt(id: CutId, t: number, reduced: boolean): number {
  if (reduced) return 0;
  const snap = snapTime(id);
  return smoothstep(snap, snap + 0.12, t) * (1 - smoothstep(snap + 0.36, snap + 1.6, t));
}

/** Under reduced motion the fall and the rise are a fade through the sky colour. */
const FADE = 0.5;

/** Accelerates like a fall, easing only slightly into the landing. */
const fallCurve = (t: number) => t * t * (2 - t);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** When the falling part ends and the cut's cards begin. */
export function fallEnd(id: CutId, reduced: boolean): number {
  if (reduced) return snapTime(id) + 2 * FADE;
  return id === 'snap' ? SNAP.land : SLACK.land;
}

/** Altitude during the cut, from the trigger altitude down to the rooftops. */
export function cutAltitude(id: CutId, t: number, reduced: boolean): number {
  const { altitude: from, fallTo: to } = cutStop(id);
  const start = snapTime(id);
  if (reduced) return t < start + FADE ? from : to;
  const end = fallEnd(id, false);
  const p = Math.min(1, Math.max(0, (t - start) / (end - start)));
  // Once the string is cut the kite drops faster and faster.
  return from - (from - to) * fallCurve(p);
}

/** 0 to 1 as the kite settles onto the roof at the end of the fall. */
export function landedAt(id: CutId, t: number, reduced: boolean): number {
  const end = fallEnd(id, reduced);
  return reduced ? (t >= end - FADE ? 1 : 0) : smoothstep(end - 0.6, end, t);
}

export function riseDuration(id: CutId, reduced: boolean): number {
  if (reduced) return 2 * FADE;
  const { fallTo, riseTo } = cutStop(id);
  return RELAUNCH.liftOff + RELAUNCH.climb + (riseTo - fallTo) / 150;
}

/** Altitude while the new kite waits on the parapet, lifts off, and climbs back to the next chapter. */
export function riseAltitude(id: CutId, t: number, reduced: boolean): number {
  const { fallTo, riseTo } = cutStop(id);
  if (reduced) return t < FADE ? fallTo : riseTo;
  const p = Math.min(1, Math.max(0, (t - RELAUNCH.liftOff) / (riseDuration(id, false) - RELAUNCH.liftOff)));
  return fallTo + (riseTo - fallTo) * easeInOutSine(p);
}

/** 0 to 1: the short tugs on the string that coax the new kite off the parapet. */
export function tugAt(t: number, reduced: boolean): number {
  if (reduced) return 0;
  return RELAUNCH.tugs.reduce((sum, at) => sum + Math.exp(-(((t - at) / 0.09) ** 2)), 0);
}

/** Opacity of the fade veil under reduced motion: in, cut to the new place, out. */
export function veilAt(start: number, t: number): number {
  return smoothstep(start, start + FADE, t) * (1 - smoothstep(start + FADE, start + 2 * FADE, t));
}
