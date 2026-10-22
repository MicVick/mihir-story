import { useEffect, useState, type CSSProperties } from 'react';
import { cutStop } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, ui, type Chapter } from '../content/story';
import { SNAP } from '../scene/cutTimeline';
import { useFlight, type CutState } from '../state/store';
import { DecisionPanel } from './DecisionPanel';
import { HoldButton } from './HoldButton';
import { RevealCard } from './RevealCard';
import { StoryCard } from './StoryCard';

/** How long "Kai po che!" stays up after the strings cross. */
const SHOUT_MS = 2600;

/**
 * The HTML side of a cut. Cut 1: "Kai po che!" as the rival crosses, then
 * the two cut cards and "Re-tie the string". Cut 2: the stall card, then
 * Decision 4 with both kites on the rooftop, then the reveal and the launch.
 */
export function CutSequence() {
  const cut = useFlight((s) => (s.phase === 'cut' ? s.cut : null));
  if (!cut) return null;

  const chapter = chapters[cutStop(cut.id).chapter];
  const tone = skies[chapter.sky].card;
  const kite = kites[chapter.kite];
  const style = { '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties;

  return (
    <>
      {cut.id === 'snap' && <Shout startedAt={cut.startedAt} />}
      {cut.step > 0 && (
        <div className="beats">
          <div
            key={cut.step}
            // The rooftop decision gets the taller sheet on mobile so both options show in full.
            className={`beat is-active cut-step${cut.step > chapter.cards.length ? ' beat--decision' : ''}`}
            style={style}
          >
            <CutStep cut={cut} chapter={chapter} tone={tone} />
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {liveText(cut, chapter)}
      </p>
    </>
  );
}

function CutStep({ cut, chapter, tone }: { cut: CutState; chapter: Chapter; tone: 'light' | 'dark' }) {
  const advanceCut = useFlight((s) => s.advanceCut);
  const relaunch = useFlight((s) => s.relaunch);
  const choose = useFlight((s) => s.choose);
  const chosen = useFlight((s) => (chapter.decision ? s.choices[chapter.decision.id] : undefined));
  const cards = chapter.cards;
  const card = cards[cut.step - 1];

  if (card) {
    const last = cut.step === cards.length;
    return (
      <StoryCard card={card} tone={tone}>
        {cut.id === 'snap' && last ? (
          <div className="cut-step__action">
            <HoldButton label={ui.retie} onComplete={relaunch} />
          </div>
        ) : (
          <button type="button" className="continue" onClick={advanceCut} autoFocus>
            {ui.continue}
          </button>
        )}
      </StoryCard>
    );
  }

  const decision = chapter.decision;
  if (!decision) return null;
  if (!chosen) {
    return <DecisionPanel decision={decision} tone={tone} onChoose={(choice) => choose(decision.id, choice)} />;
  }
  // Whatever the visitor picked, the reveal shows the new kite, and Continue launches it.
  return <RevealCard decision={decision} tone={tone} chosen={chosen} onContinue={relaunch} />;
}

/** "Kai po che!" on screen from the moment the rival's string crosses Mihir's. */
function Shout({ startedAt }: { startedAt: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const elapsed = performance.now() - startedAt;
    const show = window.setTimeout(() => setVisible(true), Math.max(0, SNAP.cross * 1000 - elapsed));
    const hide = window.setTimeout(() => setVisible(false), Math.max(0, SNAP.cross * 1000 + SHOUT_MS - elapsed));
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [startedAt]);
  return visible ? (
    <p className="shout-flight" lang="gu-Latn">
      {ui.rivalShout}
    </p>
  ) : null;
}

function liveText(cut: CutState, chapter: Chapter): string {
  const card = chapter.cards[cut.step - 1];
  if (cut.step === 0) return cut.id === 'snap' ? ui.rivalShout : '';
  if (card) return card.body ?? '';
  return chapter.decision ? `${ui.windLabel} ${chapter.decision.prompt}` : '';
}
