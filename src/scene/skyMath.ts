// Sky colour, sun, moon, stars and cloud cover as a function of altitude.
// Colours hold for the first part of each chapter's band, then blend into
// the next chapter's sky, so the change follows the climb, never a timer.

import { Color } from 'three';
import { skies } from '../content/palette';
import { chapters } from '../content/story';

export interface SkySample {
  top: Color;
  horizon: Color;
  /** 0 to 1. Grey, dense clouds in Chapters 3 and 6. */
  overcast: number;
  /** 0 to 1. Moon and stars. */
  night: number;
  /** Sun position in screen UV (0 to 1) and visibility. */
  sun: { x: number; y: number; v: number };
}

export function createSkySample(): SkySample {
  return { top: new Color(), horizon: new Color(), overcast: 0, night: 0, sun: { x: 0, y: 0, v: 0 } };
}

const tops = chapters.map((c) => new Color(skies[c.sky].top));
const horizons = chapters.map((c) => new Color(skies[c.sky].horizon));
const starts = chapters.map((c) => c.altitude);

// [altitude, x, y, visibility]: low east at dawn, high at noon, low west at sunset, gone at night.
const SUN_KEYS: [number, number, number, number][] = [
  [0, 0.16, 0.3, 1],
  [300, 0.5, 0.86, 1],
  [650, 0.74, 0.48, 1],
  [750, 0.85, 0.18, 1],
  [850, 0.9, -0.15, 0],
];

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Rises from 0 to 1 between a and b, holds, falls back to 0 between c and d. */
const bump = (x: number, a: number, b: number, c: number, d: number) =>
  smoothstep(a, b, x) * (1 - smoothstep(c, d, x));

export function sampleSky(altitude: number, out: SkySample): SkySample {
  let i = 0;
  while (i < starts.length - 1 && altitude >= starts[i + 1]) i++;
  if (i === starts.length - 1) {
    out.top.copy(tops[i]);
    out.horizon.copy(horizons[i]);
  } else {
    const t = (altitude - starts[i]) / (starts[i + 1] - starts[i]);
    const k = smoothstep(0.35, 1, t);
    out.top.copy(tops[i]).lerp(tops[i + 1], k);
    out.horizon.copy(horizons[i]).lerp(horizons[i + 1], k);
  }

  out.overcast = Math.max(bump(altitude, 235, 255, 280, 300), 0.6 * bump(altitude, 440, 455, 530, 550));
  out.night = smoothstep(770, 850, altitude);

  let k = 0;
  while (k < SUN_KEYS.length - 2 && altitude >= SUN_KEYS[k + 1][0]) k++;
  const [a0, x0, y0, v0] = SUN_KEYS[k];
  const [a1, x1, y1, v1] = SUN_KEYS[k + 1];
  const t = smoothstep(a0, a1, altitude);
  out.sun.x = x0 + (x1 - x0) * t;
  out.sun.y = y0 + (y1 - y0) * t;
  out.sun.v = v0 + (v1 - v0) * t;
  return out;
}
