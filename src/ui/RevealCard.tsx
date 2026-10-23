import type { ReactNode } from 'react';
import type { CardTone } from '../content/palette';
import { ui, type Choice, type Decision } from '../content/story';
import { ArrowIcon } from './icons';
import { hasPhoto, Polaroid } from './Polaroid';

interface Props {
  decision: Decision;
  tone: CardTone;
  chosen: Choice;
  eyebrow?: ReactNode;
  /** Flight mode only: shows "Continue" and takes focus so keyboard users can move on. */
  onContinue?: () => void;
  /** Flight loads photos one chapter ahead; until then the slot stays empty. */
  loadPhoto?: boolean;
}

export function RevealCard({ decision, tone, chosen, eyebrow, onContinue, loadPhoto = true }: Props) {
  return (
    <article className={`card card--${tone} reveal`}>
      {eyebrow}
      <dl className={`ledger${chosen === decision.mihir ? ' is-same' : ''}`}>
        <div className="ledger__row">
          <dt>{ui.youChose}</dt>
          <dd>{decision.options[chosen].label}</dd>
        </div>
        <div className="ledger__row ledger__row--mine">
          <dt>{ui.iChose}</dt>
          <dd>{decision.options[decision.mihir].label}</dd>
        </div>
      </dl>
      {hasPhoto(decision.photo) && loadPhoto && <Polaroid src={decision.photo} alt={decision.photoAlt ?? ''} ratio={decision.photoRatio} />}
      <p className="card__body">{decision.reveal}</p>
      {decision.result && <p className="stat">{decision.result}</p>}
      {onContinue && (
        <button type="button" className="pill pill--primary continue" onClick={onContinue} autoFocus>
          {ui.continue}
          <ArrowIcon />
        </button>
      )}
    </article>
  );
}
