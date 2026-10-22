import { useEffect } from 'react';
import { beatIndexAt, beats, type Beat } from '../content/beats';
import { LAUNCH_MS, useFlight } from '../state/store';

/** Metres per second of the steady presenter climb. */
const SPEED = 22;
/** Cards stay on screen this much longer than their reading time in presenter mode. */
const EXTRA_MS = 2000;
const WORDS_PER_SECOND = 3.2;
const MIN_READ_MS = 4000;

function words(beat: Beat): number {
  const text =
    beat.kind === 'card'
      ? [beat.card.title, beat.card.body, beat.card.stat].join(' ')
      : beat.kind === 'chips'
        ? [beat.title, ...beat.chips.map((c) => c.body)].join(' ')
        : '';
  return text.split(/\s+/).filter(Boolean).length;
}

const readMs = (beat: Beat) => Math.max(MIN_READ_MS, (words(beat) / WORDS_PER_SECOND) * 1000) + EXTRA_MS;
/** Where the kite pauses in a beat's band while its card is read. */
const readingPoint = (beat: Beat) => beat.start + (beat.end - beat.start) * 0.35;

/**
 * Presenter mode (P or ?present): the kite climbs by itself at a steady pace
 * and waits on each card long enough to read it aloud. Decisions, the cut
 * cards and the lanterns still wait for a click, so the room can vote.
 */
export function usePresenter() {
  const presenter = useFlight((s) => s.presenter);

  useEffect(() => {
    document.documentElement.classList.toggle('is-presenting', presenter);
    if (!presenter) return;
    let frame = 0;
    let last = performance.now();
    // The beat being read and when its reading time ends.
    let reading: { index: number; until: number } | null = null;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const s = useFlight.getState();
      const launching = s.launchedAt !== null && now - s.launchedAt < LAUNCH_MS;
      if (s.phase !== 'flying' || s.menuOpen || launching) {
        reading = null;
        return;
      }
      const index = beatIndexAt(s.altitude);
      const beat = beats[index];
      // A decision already answered (its reveal) is passed straight through.
      const goal = beat.kind === 'decision' ? beats[index + 1]?.start ?? beat.end : readingPoint(beat);

      if (s.targetAltitude < goal - 0.01) {
        s.nudge(Math.min(goal - s.targetAltitude, SPEED * dt));
        return;
      }
      if (Math.abs(s.altitude - s.targetAltitude) > 0.5) return;
      if (!reading || reading.index !== index) reading = { index, until: now + readMs(beat) };
      if (now < reading.until) return;
      // Read: climb on into the next beat.
      if (beats[index + 1]) s.nudge(SPEED * dt);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [presenter]);
}
