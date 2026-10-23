import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CardTone } from '../content/palette';
import { ending, ui } from '../content/story';
import { hasWebGL, isLowEnd } from '../lib/device';
import { compareChoices } from '../state/compare';
import { useFlight } from '../state/store';
import { Comparison } from './Comparison';
import { ArrowIcon, HomeIcon, LinkIcon, MailIcon } from './icons';
import { hasPhoto } from './Polaroid';

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

/**
 * "Let's connect": a photo, a few lines on who all of this made me, and the
 * ways to reach me. Then the next step: back to the start, or the other way
 * to read the story.
 */
export function Connect({ inStory, headingId }: { inStory: boolean; headingId: string }) {
  const resetFlight = useFlight((s) => s.resetFlight);
  const setMode = useFlight((s) => s.setMode);
  const { connect } = ending;

  const home = () => {
    resetFlight();
    window.scrollTo({ top: 0 });
  };
  const flyAgain = () => {
    resetFlight();
    setMode('flight');
  };

  return (
    <div className="connect__inner">
      {hasPhoto(connect.photo) && <img className="connect__photo" src={`/photos/${connect.photo}`} alt={connect.photoAlt} />}
      <p className="connect__kicker">{connect.kicker}</p>
      <h2 className="connect__heading" id={headingId}>
        {connect.heading}
      </h2>
      <p className="connect__body">{connect.body}</p>
      <p className="connect__name">
        <strong>{connect.name}</strong>
        <span>{connect.role}</span>
      </p>
      <div className="connect__links">
        <a className="pill pill--primary" href={`mailto:${ending.contact.email}`}>
          <MailIcon />
          {ending.buttons.email}
        </a>
        <a className="pill pill--light" href={ending.contact.linkedin} target="_blank" rel="noopener noreferrer">
          <LinkIcon />
          {ending.buttons.linkedin}
        </a>
      </div>
      <div className="connect__next">
        <button type="button" className="pill pill--ghost" onClick={home}>
          <HomeIcon />
          {ending.buttons.home}
        </button>
        {inStory
          ? hasWebGL() &&
            !isLowEnd() && (
              <button type="button" className="pill pill--ghost" onClick={flyAgain}>
                {ending.buttons.flyAgain}
              </button>
            )
          : (
              <button type="button" className="pill pill--ghost" onClick={() => setMode('story')}>
                {ending.buttons.readStory}
              </button>
            )}
      </div>
    </div>
  );
}

/** Flight: "Let's connect" over the night sky, once the visitor moves on from the comparison. */
export function ConnectScreen() {
  const open = useFlight((s) => s.connect && s.phase === 'ending');
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <section ref={ref} className="connect connect--screen" aria-labelledby="connect-heading" tabIndex={-1}>
      <Connect inStory={false} headingId="connect-heading" />
    </section>
  );
}

/** Pause after the last lantern rises before the comparison appears. */
const PANEL_DELAY_MS = 1500;

/**
 * Flight ending at night. First the visitor releases the three lanterns
 * (see LanternField); then the comparison and the closing line, and "Next"
 * opens the last screen.
 */
export function Ending({ tone, eyebrow }: { tone: CardTone; eyebrow?: ReactNode }) {
  const allReleased = useFlight((s) => s.lanterns.length >= ending.lanterns.length);
  const setConnect = useFlight((s) => s.setConnect);
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
      <div className="actions">
        <button type="button" className="pill pill--primary" onClick={() => setConnect(true)}>
          {ending.buttons.next}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
