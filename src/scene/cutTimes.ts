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

/**
 * Cut 2, the stall: no rival this time. The string pulls tight in a hard
 * wind, shakes, and gives way on its own; the kite falls again.
 */
export const SLACK = {
  /** The string starts to strain. */
  strain: 0.2,
  /** The string snaps. */
  snap: 1.7,
  /** The kite comes to rest on the rooftops. */
  land: 5.2,
};

/** When the string parts in each cut. */
export const snapTime = (id: 'snap' | 'slack') => (id === 'snap' ? SNAP.snap : SLACK.snap);

/**
 * The relaunch after a cut, from the terrace: the camera comes back down to
 * the roof, a few tugs on the string, then the new kite lifts off and climbs.
 */
export const RELAUNCH = {
  /** The camera is back at the parapet. */
  settle: 0.9,
  /** The tugs, in seconds from the start. */
  tugs: [1.05, 1.45, 1.85],
  /** The kite leaves the parapet. */
  liftOff: 2.2,
  /** Seconds of climb, plus one more per 150 m. */
  climb: 3,
};
