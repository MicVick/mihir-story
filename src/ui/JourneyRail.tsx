import { useEffect, useRef, type CSSProperties } from 'react';
import { cutStop, MAX_ALTITUDE } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters } from '../content/story';
import { useFlight } from '../state/store';

/**
 * The whole journey down the left edge (desktop only): one stop per chapter
 * at its altitude, the kite moving along it, and the thread let out so far.
 * Stops ahead are plain dots; once reached they show what happened there,
 * a diamond for a decision and a break for a cut.
 */
export function JourneyRail() {
  const visited = useFlight((s) => s.visited);
  const current = useFlight((s) => (s.cut && (s.phase === 'cut' || s.phase === 'relaunch') ? cutStop(s.cut.id).chapter : s.chapterIndex));
  const hidden = useFlight((s) => s.phase === 'intro');
  const kite = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const place = (altitude: number) => kite.current?.style.setProperty('--at', String(Math.min(1, altitude / MAX_ALTITUDE)));
    place(useFlight.getState().altitude);
    return useFlight.subscribe((s) => place(s.altitude));
  }, []);

  const reached = Math.max(...visited.map((i) => chapters[i].altitude)) / MAX_ALTITUDE;
  const chapter = chapters[current];
  const dark = skies[chapter.sky].card === 'dark';

  return (
    <div
      className={`rail${dark ? ' rail--on-dark' : ''}${hidden ? ' is-hidden' : ''}`}
      style={{ '--kite': kites[chapter.kite].main } as CSSProperties}
      aria-hidden="true"
    >
      <span className="rail__track" />
      <span className="rail__thread" style={{ '--at': reached } as CSSProperties} />
      {chapters.map((c) => {
        const seen = visited.includes(c.index);
        const kind = !seen ? 'ahead' : c.cut ? 'cut' : c.decision ? 'decision' : 'story';
        return (
          <span
            key={c.index}
            className={`rail__stop rail__stop--${kind}${c.index === current ? ' is-current' : ''}`}
            style={{ '--at': c.altitude / MAX_ALTITUDE } as CSSProperties}
          >
            <span className="rail__mark" />
            {seen && (
              <span className="rail__label">
                <span className="rail__num">{c.index}</span> {c.title}
              </span>
            )}
          </span>
        );
      })}
      <span className="rail__kite" ref={kite} />
    </div>
  );
}
