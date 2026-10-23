// The cut timings on their own, so the sound code can use them without loading the scene.

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
