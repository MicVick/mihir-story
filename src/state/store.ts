import { create } from 'zustand';
import {
  ceilingFor,
  chapterAt,
  cutStop,
  ENDING_ALTITUDE,
  kiteFor,
  nextStop,
  type CutId,
  type Stop,
} from '../content/beats';
import { chapters, ending, type Choice, type KiteId } from '../content/story';
import { initialMode } from '../lib/device';

export type Phase = 'intro' | 'flying' | 'deciding' | 'revealing' | 'cut' | 'relaunch' | 'ending';

export interface CutState {
  id: CutId;
  /** performance.now() when the cut began. */
  startedAt: number;
  /**
   * 0 while the kite falls; then one step per cut card. The snap cut ends on
   * its last card with "Re-tie the string". The slack cut goes on to its
   * decision, then the reveal with the launch of the new kite.
   */
  step: number;
  /** performance.now() when the relaunch began, once it has. */
  relaunchAt?: number;
}

export interface FlightState {
  phase: Phase;
  altitude: number; // 0 to 900, damped
  targetAltitude: number; // raw input value
  chapterIndex: number; // 0 to 10
  kite: KiteId;
  choices: Record<string, Choice>; // keyed by decision id
  visited: number[]; // chapter indexes reached
  sound: boolean;
  mode: 'flight' | 'story';
  presenter: boolean;
  /** Highest altitude the visitor may climb to right now. Decisions and cuts lower it. */
  ceiling: number;
  /** The most recent choice in flight mode, for the reveal drift. */
  lastChoice: { side: Choice; at: number } | null;
  /** The cut in progress, from the snap or slack until the new kite is back in the air. */
  cut: CutState | null;
  cutsDone: CutId[];
  /** Indexes of the hero lanterns released in the ending. */
  lanterns: number[];
  /** performance.now() when "Hold to launch" completed, or null while the kite waits on the terrace. */
  launchedAt: number | null;
  /** The spool menu is open; flight input pauses. */
  menuOpen: boolean;
  /** The 3D scene has drawn its first frame, so the kite can be launched. */
  sceneReady: boolean;
}

interface FlightActions {
  /** "Hold to launch": the kite lifts off the parapet and climbs to the first card. */
  launch: () => void;
  /** Moves the target altitude by a raw input delta in metres. */
  nudge: (metres: number) => void;
  /** Called every frame with the damped (or scripted) altitude. */
  setAltitude: (altitude: number) => void;
  /** Records a choice. A decision cannot be changed once made. */
  choose: (decisionId: string, choice: Choice) => void;
  /** Leaves the reveal and unlocks the climb ("Continue"). */
  continueFlight: () => void;
  /** Moves the cut on to its next card. */
  advanceCut: () => void;
  /** "Re-tie the string", or the launch of the new kite after Decision 4. */
  relaunch: () => void;
  /** Called by the scene when the new kite has climbed back. */
  finishRelaunch: () => void;
  releaseLantern: (index: number) => void;
  setMode: (mode: FlightState['mode']) => void;
  setSound: (on: boolean) => void;
  setPresenter: (on: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  /** Spool menu: fly back to a chapter already reached. */
  jumpTo: (chapterIndex: number) => void;
  /** Clears choices and progress for "Fly again". */
  resetFlight: () => void;
}

const STORAGE_KEY = 'kite-story:v1';
/** The reveal stays on screen at least this long before a climb input moves on. */
export const REVEAL_HOLD_MS = 1500;
/** How far "Continue" lifts the kite, so the move is visible. */
const CONTINUE_METRES = 15;
/** The launch carries the kite off the terrace to the first card. */
export const LAUNCH_TO = 45;
export const LAUNCH_MS = 2600;
/** Once launched, the kite never sinks back onto the terrace except in a cut. */
export const MIN_FLIGHT = 20;

type Saved = Pick<FlightState, 'choices' | 'visited' | 'cutsDone'>;

// localStorage is optional: the site must work fully without it.
function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      choices: parsed.choices && typeof parsed.choices === 'object' ? parsed.choices : {},
      visited: Array.isArray(parsed.visited) ? parsed.visited : [0],
      cutsDone: Array.isArray(parsed.cutsDone)
        ? parsed.cutsDone.filter((c): c is CutId => c === 'snap' || c === 'slack')
        : [],
    };
  } catch {
    return null;
  }
}

function save(state: Saved) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or blocked storage: keep going in memory.
  }
}

function presenterFromUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('present');
  } catch {
    return false;
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** How far into a chapter's band the spool menu lands. */
const JUMP_INTO = 6;

const launching = (s: Pick<FlightState, 'launchedAt'>) =>
  s.launchedAt !== null && performance.now() - s.launchedAt < LAUNCH_MS;

/** Phase implied by altitude while the visitor is in control of the climb. */
function phaseAt(altitude: number, stop: Stop | undefined): Phase {
  if (altitude >= ENDING_ALTITUDE) return 'ending';
  if (stop?.kind === 'decision' && altitude >= stop.altitude - 0.5) return 'deciding';
  return 'flying';
}

const fresh = {
  phase: 'intro' as Phase,
  altitude: 0,
  targetAltitude: 0,
  chapterIndex: 0,
  choices: {},
  visited: [0],
  lastChoice: null,
  cut: null,
  cutsDone: [] as CutId[],
  lanterns: [],
  launchedAt: null,
  menuOpen: false,
};

const saved = loadSaved();

export const useFlight = create<FlightState & FlightActions>()((set, get) => ({
  ...fresh,
  ...saved,
  kite: kiteFor(saved?.cutsDone ?? []),
  ceiling: ceilingFor(saved?.choices ?? {}, saved?.cutsDone ?? []),
  sound: false,
  sceneReady: false,
  presenter: presenterFromUrl(),
  mode: initialMode(),

  launch: () =>
    set((s) =>
      s.phase === 'intro' && s.sceneReady
        ? { phase: 'flying', launchedAt: performance.now(), targetAltitude: Math.min(LAUNCH_TO, s.ceiling) }
        : {},
    ),

  nudge: (metres) =>
    set((s) => {
      let phase = s.phase;
      // The kite waits on the terrace for "Hold to launch", and the launch itself is scripted.
      if (phase === 'intro' || s.menuOpen || launching(s)) return {};
      // Cuts are scripted: input waits until the new kite is back in the air.
      if (phase === 'cut' || phase === 'relaunch') return {};
      if (phase === 'revealing') {
        // Hold the reveal briefly so it is read, then any input moves on.
        if (performance.now() - (s.lastChoice?.at ?? 0) < REVEAL_HOLD_MS) return {};
        phase = 'flying';
      }
      return { phase, targetAltitude: clamp(s.targetAltitude + metres, MIN_FLIGHT, s.ceiling) };
    }),

  setAltitude: (altitude) => {
    const s = get();
    const chapterIndex = chapterAt(altitude);
    const visited = s.visited.includes(chapterIndex)
      ? s.visited
      : [...s.visited, chapterIndex].sort((a, b) => a - b);
    const steering = s.phase === 'flying' || s.phase === 'deciding' || s.phase === 'ending';
    const stop = nextStop(s.choices, s.cutsDone);

    if (steering && stop?.kind === 'cut' && altitude >= stop.altitude - 0.5) {
      set({
        altitude,
        chapterIndex,
        visited,
        phase: 'cut',
        cut: { id: stop.id, startedAt: performance.now(), step: 0 },
      });
      return;
    }
    set({ altitude, chapterIndex, visited, phase: steering ? phaseAt(altitude, stop) : s.phase });
  },

  choose: (decisionId, choice) => {
    const s = get();
    if (s.choices[decisionId]) return;
    const choices = { ...s.choices, [decisionId]: choice };
    if (s.phase === 'cut' && s.cut) {
      // Decision 4 is made on the rooftop during the slack cut: show the reveal next.
      set({ choices, cut: { ...s.cut, step: s.cut.step + 1 } });
      return;
    }
    set({
      choices,
      ceiling: ceilingFor(choices, s.cutsDone),
      ...(s.mode === 'flight' && { phase: 'revealing' as const, lastChoice: { side: choice, at: performance.now() } }),
    });
  },

  continueFlight: () =>
    set((s) => ({
      phase: 'flying',
      targetAltitude: clamp(s.targetAltitude + CONTINUE_METRES, 0, s.ceiling),
    })),

  advanceCut: () => set((s) => (s.cut ? { cut: { ...s.cut, step: s.cut.step + 1 } } : {})),

  relaunch: () => {
    const s = get();
    if (!s.cut || s.phase !== 'cut') return;
    const cutsDone = [...s.cutsDone, s.cut.id];
    set({
      phase: 'relaunch',
      cut: { ...s.cut, relaunchAt: performance.now() },
      cutsDone,
      kite: kiteFor(cutsDone),
      ceiling: ceilingFor(s.choices, cutsDone),
    });
  },

  finishRelaunch: () => {
    const s = get();
    if (!s.cut) return;
    const { riseTo } = cutStop(s.cut.id);
    set({ phase: 'flying', cut: null, altitude: riseTo, targetAltitude: riseTo });
  },

  releaseLantern: (index) =>
    set((s) =>
      s.lanterns.includes(index) || index < 0 || index >= ending.lanterns.length
        ? {}
        : { lanterns: [...s.lanterns, index] },
    ),

  setMode: (mode) => set({ mode }),
  setSound: (sound) => set({ sound }),
  setPresenter: (presenter) => set({ presenter }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),

  jumpTo: (chapterIndex) =>
    set((s) => {
      const chapter = chapters[chapterIndex];
      const free = s.phase === 'flying' || s.phase === 'deciding' || s.phase === 'revealing' || s.phase === 'ending';
      if (!chapter || !s.visited.includes(chapterIndex) || !free || launching(s)) return {};
      // Land just inside the chapter, on its first card, or the reveal of a decision already made.
      const target = chapterIndex === 0 ? LAUNCH_TO : chapter.altitude + JUMP_INTO;
      return { phase: 'flying', targetAltitude: clamp(target, MIN_FLIGHT, s.ceiling) };
    }),

  resetFlight: () => set({ ...fresh, kite: 1, ceiling: ceilingFor({}, []), presenter: get().presenter }),
}));

useFlight.subscribe((s, prev) => {
  if (s.choices !== prev.choices || s.visited !== prev.visited || s.cutsDone !== prev.cutsDone) {
    save({ choices: s.choices, visited: s.visited, cutsDone: s.cutsDone });
  }
});
