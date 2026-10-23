// Altitude layout of the flight, derived from story.ts. Holds no copy.
// Each chapter owns the band from its trigger altitude up to the next
// chapter's. The band is split evenly between the chapter's beats, so one
// card is on screen at a time.

import { chapters, type Chapter, type Choice, type Decision, type StoryCard } from './story';

export const MAX_ALTITUDE = 900;

interface BeatBase {
  id: string;
  chapter: number;
  start: number;
  end: number;
}

export type Beat =
  | (BeatBase & { kind: 'card'; card: StoryCard })
  | (BeatBase & { kind: 'chips'; chips: StoryCard[]; title?: string })
  | (BeatBase & { kind: 'decision'; decision: Decision })
  | (BeatBase & { kind: 'ending' });

type WithoutBand<T> = T extends unknown ? Omit<T, 'start' | 'end'> : never;
type BeatContent = WithoutBand<Beat>;

function beatsFor(chapter: Chapter): BeatContent[] {
  const c = chapter.index;
  const list: BeatContent[] = [];
  const chips = chapter.chips && ({ id: `chips-${c}`, chapter: c, kind: 'chips', chips: chapter.chips, title: chapter.chipsTitle } as const);
  if (chips && chapter.chipsFirst) list.push(chips);
  for (const card of chapter.cards) list.push({ id: card.id, chapter: c, kind: 'card', card });
  if (chips && !chapter.chipsFirst) list.push(chips);
  if (chapter.decision) {
    list.push({ id: `decision-${chapter.decision.id}`, chapter: c, kind: 'decision', decision: chapter.decision });
  }
  if (c === chapters.length - 1) list.push({ id: 'ending', chapter: c, kind: 'ending' });
  return list;
}

export const beats: Beat[] = chapters.flatMap((chapter, i) => {
  const start = chapter.altitude;
  const end = chapters[i + 1]?.altitude ?? MAX_ALTITUDE;
  const list = beatsFor(chapter);
  const size = (end - start) / list.length;
  return list.map((b, j) => ({ ...b, start: start + j * size, end: start + (j + 1) * size }) as Beat);
});

/** Index of the beat whose band contains this altitude. */
export function beatIndexAt(altitude: number): number {
  for (let i = beats.length - 1; i >= 0; i--) {
    if (altitude >= beats[i].start) return i;
  }
  return 0;
}

/** Index of the chapter whose band contains this altitude. */
export function chapterAt(altitude: number): number {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (altitude >= chapters[i].altitude) return i;
  }
  return 0;
}

/** Altitude where the ending (night and lanterns) begins. */
export const ENDING_ALTITUDE = chapters[chapters.length - 1].altitude;

export type CutId = 'snap' | 'slack';

export type Stop =
  | { kind: 'decision'; id: Decision['id']; altitude: number }
  | {
      kind: 'cut';
      id: CutId;
      chapter: number;
      /** Where the cut begins: the chapter's trigger altitude. */
      altitude: number;
      /** Where the kite comes to rest: 0 is the home terrace. */
      fallTo: number;
      /** Where the relaunched kite climbs back to: the next chapter. */
      riseTo: number;
    };

/**
 * Everything that stops the climb, in altitude order. A decision locks just
 * inside its band, once its card is up. A cut starts at its chapter's
 * altitude; a decision inside a cut chapter is made during the cut.
 */
export const stops: Stop[] = [
  ...chapters.flatMap((chapter, i): Stop[] =>
    chapter.cut
      ? [
          {
            kind: 'cut',
            id: chapter.cut,
            chapter: chapter.index,
            altitude: chapter.altitude,
            fallTo: chapter.fallTo ?? 0,
            riseTo: chapters[i + 1]?.altitude ?? MAX_ALTITUDE,
          },
        ]
      : [],
  ),
  ...beats.flatMap((b): Stop[] =>
    b.kind === 'decision' && !chapters[b.chapter].cut
      ? [{ kind: 'decision', id: b.decision.id, altitude: b.start + Math.min(12, (b.end - b.start) * 0.25) }]
      : [],
  ),
].sort((a, b) => a.altitude - b.altitude);

export const cutStop = (id: CutId) => stops.find((s) => s.kind === 'cut' && s.id === id) as Extract<Stop, { kind: 'cut' }>;

/** The first stop not yet passed. */
export function nextStop(choices: Record<string, Choice>, cutsDone: CutId[]): Stop | undefined {
  return stops.find((s) => (s.kind === 'cut' ? !cutsDone.includes(s.id) : !choices[s.id]));
}

/** The highest altitude allowed: the next stop, or the top of the sky. */
export function ceilingFor(choices: Record<string, Choice>, cutsDone: CutId[]): number {
  return nextStop(choices, cutsDone)?.altitude ?? MAX_ALTITUDE;
}

/** Kite 1 until the first cut, Kite 2 until the second, then Kite 3. */
export function kiteFor(cutsDone: CutId[]): 1 | 2 | 3 {
  return cutsDone.includes('slack') ? 3 : cutsDone.includes('snap') ? 2 : 1;
}
