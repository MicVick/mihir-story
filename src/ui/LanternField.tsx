import { useRef } from 'react';
import { ending } from '../content/story';
import { useFlight } from '../state/store';

/**
 * The three hero lanterns, one per goal. Each is a button labelled "Goal 1"
 * and so on, and the next one waiting says "Tap to release"; tapping it
 * releases the lantern, which rises and shows its goal. Focus moves on to
 * the next lantern.
 */
export function LanternField() {
  const released = useFlight((s) => s.lanterns);
  const release = useFlight((s) => s.releaseLantern);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onRelease = (i: number) => {
    release(i);
    const next = ending.lanterns.findIndex((_, j) => j !== i && !released.includes(j));
    if (next !== -1) buttons.current[next]?.focus();
  };

  const waiting = ending.lanterns.findIndex((_, i) => !released.includes(i));

  return (
    <div className="lantern-field">
      {ending.lanterns.map((lantern, i) => {
        const out = released.includes(i);
        const goal = ending.goal.replace('{n}', String(i + 1));
        return (
          <button
            key={lantern.id}
            ref={(el) => (buttons.current[i] = el)}
            type="button"
            className={`hero-lantern hero-lantern--${i + 1}${out ? ' is-released' : ''}`}
            aria-label={`${goal}: ${lantern.text}`}
            disabled={out}
            onClick={() => onRelease(i)}
          >
            <span className="hero-lantern__light" aria-hidden="true" />
            <span className="hero-lantern__goal" aria-hidden="true">
              {goal}
            </span>
            {out ? (
              <span className="hero-lantern__text">{lantern.text}</span>
            ) : (
              i === waiting && (
                <span className="hero-lantern__tap" aria-hidden="true">
                  {ending.tap}
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
