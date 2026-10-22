import type { CardTone } from '../content/palette';
import { ui, type Choice, type Decision } from '../content/story';

interface Props {
  decision: Decision;
  tone: CardTone;
  chosen: Choice;
  /** Flight mode only: shows "Continue" and takes focus so keyboard users can move on. */
  onContinue?: () => void;
}

export function RevealCard({ decision, tone, chosen, onContinue }: Props) {
  return (
    <article className={`card card--${tone} reveal`}>
      <div className="badges">
        <span className="badge badge--outline">
          {ui.youChose}: {decision.options[chosen].label}
        </span>
        <span className="badge badge--filled">
          {ui.iChose}: {decision.options[decision.mihir].label}
        </span>
      </div>
      <p className="card__body">{decision.reveal}</p>
      {decision.result && <p className="stat">{decision.result}</p>}
      {onContinue && (
        <button type="button" className="continue" onClick={onContinue} autoFocus>
          {ui.continue}
        </button>
      )}
    </article>
  );
}
