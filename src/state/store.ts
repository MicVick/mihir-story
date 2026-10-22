import { create } from 'zustand';
import { ceilingFor, chapterAt, ENDING_ALTITUDE, MAX_ALTITUDE } from '../content/beats';
import type { Choice, KiteId } from '../content/story';
import { initialMode } from '../lib/device';

export type Phase = 'intro' | 'flying' | 'deciding' | 'revealing' | 'cut' | 'relaunch' | 'ending';

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
  /** Highest altitude the visitor may climb to right now. Decisions lower it. */
  ceiling: number;
  /** The most recent choice in flight mode, for the reveal drift. */
  lastChoice: { side: Choice; at: number } | null;
}

interface FlightActions {
  /** Moves the target altitude by a raw input delta in metres. */
  nudge: (metres: number) => void;
  /** Called every frame with the damped altitude. */
  setAltitude: (altitude: number) => void;
  /** Records a choice. A decision cannot be changed once made. */
  choose: (decisionId: string, choice: Choice) => void;
  /** Leaves the reveal and unlocks the climb ("Continue"). */
  continueFlight: () => void;
  markVisited: (chapterIndex: number) => void;
  setMode: (mode: FlightState['mode']) => void;
  setSound: (on: boolean) => void;
  setPresenter: (on: boolean) => void;
  /** Clears choices and progress for "Fly again". */
  resetFlight: () => void;
}

const STORAGE_KEY = 'kite-story:v1';
/** The reveal stays on screen at least this long before a climb input moves on. */
export const REVEAL_HOLD_MS = 1500;
/** How far "Continue" lifts the kite, so the move is visible. */
const CONTINUE_METRES = 15;

type Saved = Pick<FlightState, 'choices' | 'visited'>;

// localStorage is optional: the site must work fully without it.
function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      choices: parsed.choices && typeof parsed.choices === 'object' ? parsed.choices : {},
      visited: Array.isArray(parsed.visited) ? parsed.visited : [0],
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

const initial: FlightState = {
  phase: 'intro',
  altitude: 0,
  targetAltitude: 0,
  chapterIndex: 0,
  kite: 1,
  choices: {},
  visited: [0],
  sound: false,
  mode: 'flight',
  presenter: false,
  ceiling: MAX_ALTITUDE,
  lastChoice: null,
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Phase implied by altitude while the visitor is in control of the climb. */
function phaseAt(altitude: number, ceiling: number): Phase {
  if (altitude >= ENDING_ALTITUDE) return 'ending';
  if (ceiling < MAX_ALTITUDE && altitude >= ceiling - 0.5) return 'deciding';
  return 'flying';
}

const saved = loadSaved();

export const useFlight = create<FlightState & FlightActions>()((set, get) => ({
  ...initial,
  ...saved,
  ceiling: ceilingFor(saved?.choices ?? {}),
  presenter: presenterFromUrl(),
  mode: initialMode(),

  nudge: (metres) =>
    set((s) => {
      let phase = s.phase;
      if (phase === 'revealing') {
        // Hold the reveal briefly so it is read, then any input moves on.
        if (performance.now() - (s.lastChoice?.at ?? 0) < REVEAL_HOLD_MS) return {};
        phase = 'flying';
      }
      if (phase === 'intro' && metres > 0) phase = 'flying';
      return { phase, targetAltitude: clamp(s.targetAltitude + metres, 0, s.ceiling) };
    }),
  setAltitude: (altitude) => {
    const s = get();
    const chapterIndex = chapterAt(altitude);
    const steering = s.phase === 'flying' || s.phase === 'deciding' || s.phase === 'ending';
    set({
      altitude,
      chapterIndex,
      phase: steering ? phaseAt(altitude, s.ceiling) : s.phase,
      visited: s.visited.includes(chapterIndex) ? s.visited : [...s.visited, chapterIndex].sort((a, b) => a - b),
    });
  },
  choose: (decisionId, choice) => {
    const s = get();
    if (s.choices[decisionId]) return;
    const choices = { ...s.choices, [decisionId]: choice };
    set({
      choices,
      ceiling: ceilingFor(choices),
      ...(s.mode === 'flight' && { phase: 'revealing' as const, lastChoice: { side: choice, at: performance.now() } }),
    });
  },
  continueFlight: () =>
    set((s) => ({
      phase: 'flying',
      targetAltitude: clamp(s.targetAltitude + CONTINUE_METRES, 0, s.ceiling),
    })),
  markVisited: (chapterIndex) => {
    if (get().visited.includes(chapterIndex)) return;
    set((s) => ({ visited: [...s.visited, chapterIndex].sort((a, b) => a - b) }));
  },
  setMode: (mode) => set({ mode }),
  setSound: (sound) => set({ sound }),
  setPresenter: (presenter) => set({ presenter }),
  resetFlight: () =>
    set({
      phase: 'intro',
      altitude: 0,
      targetAltitude: 0,
      chapterIndex: 0,
      kite: 1,
      choices: {},
      visited: [0],
      ceiling: ceilingFor({}),
      lastChoice: null,
    }),
}));

useFlight.subscribe((s, prev) => {
  if (s.choices !== prev.choices || s.visited !== prev.visited) {
    save({ choices: s.choices, visited: s.visited });
  }
});
