import type { CSSProperties } from 'react';
import { useFlight } from '../state/store';

// [top %, length vw, seconds, delay]
const STREAKS = [
  [14, 22, 2.6, 0],
  [27, 34, 3.1, 0.9],
  [41, 18, 2.4, 1.6],
  [56, 28, 2.9, 0.4],
  [68, 20, 2.2, 1.2],
  [81, 30, 3.3, 2.0],
  [34, 14, 2.0, 2.4],
];

/** While a decision is open, the wind visibly picks up: thin streaks cross the sky. */
export function WindStreaks() {
  const on = useFlight((s) => s.phase === 'deciding' || (s.phase === 'cut' && s.cut?.id === 'slack' && s.cut.step > 1));
  return (
    <div className={`wind${on ? ' is-on' : ''}`} aria-hidden="true">
      {STREAKS.map(([top, length, seconds, delay], i) => (
        <span
          key={i}
          className="wind__streak"
          style={{ '--top': `${top}%`, '--len': `${length}vw`, '--dur': `${seconds}s`, '--delay': `${delay}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
