import type { CardTone } from '../content/palette';
import { ending, ui } from '../content/story';
import { hasWebGL, isLowEnd } from '../lib/device';
import { compareChoices } from '../state/compare';
import { useFlight } from '../state/store';
import { Comparison } from './Comparison';

/** The comparison panel, or a prompt to finish the choices first. */
export function EndingComparison({ tone }: { tone: CardTone }) {
  const choices = useFlight((s) => s.choices);
  const comparison = compareChoices(choices);
  return comparison.complete ? (
    <Comparison comparison={comparison} tone={tone} />
  ) : (
    <p className={`card card--${tone} comparison__locked`}>{ui.comparisonLocked}</p>
  );
}

/** Fly again, Read the story (flight only), Email me, LinkedIn. */
export function EndingActions({ inStory }: { inStory: boolean }) {
  const resetFlight = useFlight((s) => s.resetFlight);
  const setMode = useFlight((s) => s.setMode);

  const flyAgain = () => {
    resetFlight();
    // From story mode, "Fly again" starts the flight where the device supports it.
    if (inStory && hasWebGL() && !isLowEnd()) setMode('flight');
    else window.scrollTo({ top: 0 });
  };

  return (
    <div className="actions">
      <button type="button" className="action" onClick={flyAgain}>
        {ending.buttons.flyAgain}
      </button>
      {!inStory && (
        <button type="button" className="action" onClick={() => setMode('story')}>
          {ending.buttons.readStory}
        </button>
      )}
      <a className="action" href={`mailto:${ending.contact.email}`}>
        {ending.buttons.email}
      </a>
      <a className="action" href={ending.contact.linkedin} target="_blank" rel="noopener noreferrer">
        {ending.buttons.linkedin}
      </a>
    </div>
  );
}

/** Flight ending at night: comparison, closing line and contact buttons. Lanterns join in Phase 4. */
export function Ending({ tone }: { tone: CardTone }) {
  return (
    <div className="ending">
      <p className={`card card--${tone} ending__intro`}>{ending.intro}</p>
      <EndingComparison tone={tone} />
      <p className="closing">{ending.closing}</p>
      <EndingActions inStory={false} />
    </div>
  );
}
