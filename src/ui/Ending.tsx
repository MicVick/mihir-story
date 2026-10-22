import { useEffect, useState, type ReactNode } from 'react';
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
      <button type="button" className="pill pill--primary" onClick={flyAgain}>
        {ending.buttons.flyAgain}
      </button>
      {!inStory && (
        <button type="button" className="pill pill--ghost" onClick={() => setMode('story')}>
          {ending.buttons.readStory}
        </button>
      )}
      <a className="pill pill--ghost" href={`mailto:${ending.contact.email}`}>
        {ending.buttons.email}
      </a>
      <a className="pill pill--ghost" href={ending.contact.linkedin} target="_blank" rel="noopener noreferrer">
        {ending.buttons.linkedin}
      </a>
    </div>
  );
}

/** Pause after the last lantern rises before the comparison appears. */
const PANEL_DELAY_MS = 1500;

/**
 * Flight ending at night. First the visitor releases the three lanterns
 * (see LanternField); then the comparison, closing line and contact buttons.
 */
export function Ending({ tone, eyebrow }: { tone: CardTone; eyebrow?: ReactNode }) {
  const allReleased = useFlight((s) => s.lanterns.length >= ending.lanterns.length);
  const [panel, setPanel] = useState(allReleased);

  useEffect(() => {
    if (!allReleased) {
      setPanel(false);
      return;
    }
    const id = window.setTimeout(() => setPanel(true), PANEL_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [allReleased]);

  if (!panel) {
    return (
      <div className={`card card--${tone} ending__intro`}>
        {eyebrow}
        <p className="ending__line">{ending.intro}</p>
        <p className="ending__instruction">{ending.instruction}</p>
      </div>
    );
  }
  return (
    <div className="ending">
      <EndingComparison tone={tone} />
      <p className="closing">{ending.closing}</p>
      <EndingActions inStory={false} />
    </div>
  );
}
