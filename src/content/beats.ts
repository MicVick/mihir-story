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
  | (BeatBase & { kind: 'hero' })
  | (BeatBase & { kind: 'card'; card: StoryCard })
  | (BeatBase & { kind: 'chips'; chips: StoryCard[]; title?: string })
  | (BeatBase & { kind: 'decision'; decision: Decision })
  | (BeatBase & { kind: 'ending' });

type WithoutBand<T> = T extends unknown ? Omit<T, 'start' | 'end'> : never;
type BeatContent = WithoutBand<Beat>;

function beatsFor(chapter: Chapter): BeatContent[] {
  const c = chapter.index;
  const list: BeatContent[] = [];
  if (c === 0) list.push({ id: 'hero', chapter: c, kind: 'hero' });
  if (chapter.chips && chapter.chipsTitle) {
    list.push({ id: `chips-${c}`, chapter: c, kind: 'chips', chips: chapter.chips, title: chapter.chipsTitle });
  }
  for (const card of chapter.cards) list.push({ id: card.id, chapter: c, kind: 'card', card });
  if (chapter.chips && !chapter.chipsTitle) {
    list.push({ id: `chips-${c}`, chapter: c, kind: 'chips', chips: chapter.chips });
  }
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

/** Where the climb locks for each decision: just inside the decision's band, once its card is up. */
export const decisionLocks = beats.flatMap((b) =>
  b.kind === 'decision' ? [{ id: b.decision.id, altitude: b.start + Math.min(12, (b.end - b.start) * 0.25) }] : [],
);

/** The highest altitude allowed: the lock of the first decision not yet made. */
export function ceilingFor(choices: Record<string, Choice>): number {
  return decisionLocks.find((lock) => !choices[lock.id])?.altitude ?? MAX_ALTITUDE;
}
