import type { ReactNode } from 'react';
import type { CardTone } from '../content/palette';
import { ui, type Choice, type Decision } from '../content/story';
import { ArrowIcon, WindIcon } from './icons';

interface Props {
  decision: Decision;
  tone: CardTone;
  chosen?: Choice;
  eyebrow?: ReactNode;
  onChoose: (choice: Choice) => void;
}

const ORDER: Choice[] = ['A', 'B'];

/**
 * Two equal choice buttons. Order is fixed (A then B) and both options share
 * the same size, colour and weight so nothing hints at Mihir's answer.
 */
export function DecisionPanel({ decision, tone, chosen, eyebrow, onChoose }: Props) {
  const promptId = `prompt-${decision.id}`;
  return (
    <article className={`card card--${tone} decision`}>
      {eyebrow}
      <p className="decision__wind">
        <WindIcon />
        {ui.windLabel}
      </p>
      <p id={promptId} className="decision__prompt">
        {decision.prompt}
      </p>
      <div className="choices" role="group" aria-labelledby={promptId}>
        {ORDER.map((key) => {
          const option = decision.options[key];
          return (
            <button
              key={key}
              type="button"
              className="choice"
              aria-pressed={chosen === key}
              disabled={chosen !== undefined}
              onClick={() => onChoose(key)}
            >
              <span className="choice__label">{option.label}</span>
              <span className="choice__sub">{option.sub}</span>
              <ArrowIcon className="choice__arrow" />
            </button>
          );
        })}
      </div>
    </article>
  );
}
