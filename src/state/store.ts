import { create } from 'zustand';
import { chapterAt, MAX_ALTITUDE } from '../content/beats';
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
}

interface FlightActions {
  /** Moves the target altitude by a raw input delta in metres. */
  nudge: (metres: number) => void;
  /** Called every frame with the damped altitude. */
  setAltitude: (altitude: number) => void;
  /** Records a choice. A decision cannot be changed once made. */
  choose: (decisionId: string, choice: Choice) => void;
  markVisited: (chapterIndex: number) => void;
  setMode: (mode: FlightState['mode']) => void;
  setSound: (on: boolean) => void;
  setPresenter: (on: boolean) => void;
  /** Clears choices and progress for "Fly again". */
  resetFlight: () => void;
}

const STORAGE_KEY = 'kite-story:v1';

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
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const useFlight = create<FlightState & FlightActions>()((set, get) => ({
  ...initial,
  ...loadSaved(),
  presenter: presenterFromUrl(),
  mode: initialMode(),

  nudge: (metres) =>
    set((s) => ({
      phase: s.phase === 'intro' && metres > 0 ? 'flying' : s.phase,
      targetAltitude: clamp(s.targetAltitude + metres, 0, s.ceiling),
    })),
  setAltitude: (altitude) => {
    const chapterIndex = chapterAt(altitude);
    const { visited } = get();
    set({
      altitude,
      chapterIndex,
      visited: visited.includes(chapterIndex) ? visited : [...visited, chapterIndex].sort((a, b) => a - b),
    });
  },
  choose: (decisionId, choice) => {
    if (get().choices[decisionId]) return;
    set((s) => ({ choices: { ...s.choices, [decisionId]: choice } }));
  },
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
    }),
}));

useFlight.subscribe((s, prev) => {
  if (s.choices !== prev.choices || s.visited !== prev.visited) {
    save({ choices: s.choices, visited: s.visited });
  }
});
