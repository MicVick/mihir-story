import { useRef } from 'react';
import { ending } from '../content/story';
import { useFlight } from '../state/store';

/**
 * The three hero lanterns. Each is a button; tapping it releases the lantern,
 * which rises and shows its goal. Focus moves on to the next lantern.
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

  return (
    <div className="lantern-field">
      {ending.lanterns.map((lantern, i) => {
        const out = released.includes(i);
        return (
          <button
            key={lantern.id}
            ref={(el) => (buttons.current[i] = el)}
            type="button"
            className={`hero-lantern hero-lantern--${i + 1}${out ? ' is-released' : ''}`}
            aria-label={lantern.text}
            disabled={out}
            onClick={() => onRelease(i)}
          >
            <span className="hero-lantern__light" aria-hidden="true" />
            {out && <span className="hero-lantern__text">{lantern.text}</span>}
          </button>
        );
      })}
    </div>
  );
}
