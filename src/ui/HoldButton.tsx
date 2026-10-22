import { useEffect, useRef, useState, type CSSProperties } from 'react';

const HOLD_MS = 1000;
const RADIUS = 33;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  label: string;
  onComplete: () => void;
}

/**
 * Circular button whose ring fills over one second while it is held. A
 * keyboard or switch activation (a click with no pointer) completes it at once.
 */
export function HoldButton({ label, onComplete }: Props) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number>();

  const cancel = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={`hold${holding ? ' is-holding' : ''}`}
      style={{ '--circumference': CIRCUMFERENCE } as CSSProperties}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        setHolding(true);
        timer.current = window.setTimeout(() => {
          setHolding(false);
          onComplete();
        }, HOLD_MS);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // detail is 0 for clicks from Enter, Space or a switch device.
        if (e.detail === 0) onComplete();
      }}
    >
      <svg className="hold__ring" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="hold__track" cx="36" cy="36" r={RADIUS} />
        <circle className="hold__fill" cx="36" cy="36" r={RADIUS} />
      </svg>
      <span className="hold__glyph" aria-hidden="true" />
      <span className="hold__label">{label}</span>
    </button>
  );
}
