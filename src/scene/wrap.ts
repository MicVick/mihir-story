/** Wraps v into [center - half, center + half), so objects recycle around the camera. */
export const wrap = (v: number, center: number, half: number) =>
  center + ((((v - center + half) % (2 * half)) + 2 * half) % (2 * half)) - half;

/** Small seeded random generator, so layouts are the same on every visit. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
