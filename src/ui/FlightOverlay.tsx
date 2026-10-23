import type { CSSProperties } from 'react';
import { beatIndexAt, beats, type Beat } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, ending, intro, ui, type Choice } from '../content/story';
import { compareChoices } from '../state/compare';
import { LAUNCH_TO, useFlight } from '../state/store';
import { Chips } from './Chips';
import { CutSequence } from './CutSequence';
import { DecisionPanel } from './DecisionPanel';
import { Ending } from './Ending';
import { Eyebrow } from './Eyebrow';
import { ChevronUpIcon } from './icons';
import { JourneyRail } from './JourneyRail';
import { LanternField } from './LanternField';
import { Moments } from './Moments';
import { RevealCard } from './RevealCard';
import { SpoolMenu } from './SpoolMenu';
import { StoryCard } from './StoryCard';
import { TopBar } from './TopBar';

/**
 * Every beat is rendered once and stacked in the same slot; only the beat
 * whose altitude band holds the kite is visible. CSS fades and lifts it in.
 */
export function FlightOverlay() {
  // Before launch the hero has the screen; during a cut the cards step aside for the cut sequence.
  const active = useFlight((s) =>
    s.phase === 'intro' || s.phase === 'cut' || s.phase === 'relaunch' ? -1 : beatIndexAt(s.altitude),
  );
  const atEnding = useFlight((s) => s.phase === 'ending');
  const choices = useFlight((s) => s.choices);
  const lanterns = useFlight((s) => s.lanterns.length);
  const chapterIndex = useFlight((s) => s.chapterIndex);

  return (
    <>
      <div className="beats">
        {beats.map((beat, i) => (
          <BeatView key={beat.id} beat={beat} active={i === active} loadPhoto={chapterIndex >= beat.chapter - 1} />
        ))}
      </div>
      <Hint />
      <Moments />
      <JourneyRail />
      {atEnding && <LanternField />}
      <CutSequence />
      <TopBar />
      <SpoolMenu />
      <p className="sr-only" aria-live="polite">
        {active >= 0 ? liveText(beats[active], choices, lanterns) : ''}
      </p>
    </>
  );
}

function BeatView({ beat, active, loadPhoto }: { beat: Beat; active: boolean; loadPhoto: boolean }) {
  const chapter = chapters[beat.chapter];
  const tone = skies[chapter.sky].card;
  const kite = kites[chapter.kite];
  const style = { '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties;
  const eyebrow = <Eyebrow chapter={chapter} />;

  return (
    <div className={`beat beat--${beat.kind}${active ? ' is-active' : ''}`} style={style} aria-hidden={!active}>
      {beat.kind === 'card' && <StoryCard card={beat.card} tone={tone} eyebrow={eyebrow} loadPhoto={loadPhoto} />}
      {beat.kind === 'chips' && <Chips chips={beat.chips} tone={tone} title={beat.title} eyebrow={eyebrow} />}
      {beat.kind === 'decision' && <FlightDecision beat={beat} tone={tone} eyebrow={eyebrow} />}
      {beat.kind === 'ending' && <Ending tone={tone} eyebrow={eyebrow} />}
    </div>
  );
}

/** The open decision, or its reveal once chosen. Descending re-shows the reveal; a choice never changes. */
function FlightDecision({
  beat,
  tone,
  eyebrow,
}: {
  beat: Extract<Beat, { kind: 'decision' }>;
  tone: 'light' | 'dark';
  eyebrow: JSX.Element;
}) {
  const { decision } = beat;
  const chosen = useFlight((s) => s.choices[decision.id]);
  const revealing = useFlight((s) => s.phase === 'revealing');
  const choose = useFlight((s) => s.choose);
  const continueFlight = useFlight((s) => s.continueFlight);

  if (!chosen) {
    return (
      <DecisionPanel
        decision={decision}
        tone={tone}
        eyebrow={eyebrow}
        onChoose={(choice) => choose(decision.id, choice)}
      />
    );
  }
  return (
    <RevealCard
      decision={decision}
      tone={tone}
      chosen={chosen}
      eyebrow={eyebrow}
      onContinue={revealing ? continueFlight : undefined}
    />
  );
}

/** "Scroll or swipe up to fly higher", once the kite is up, until the visitor first climbs. */
function Hint() {
  const show = useFlight(
    (s) => s.phase === 'flying' && s.launchedAt !== null && s.targetAltitude <= LAUNCH_TO + 1 && s.altitude < LAUNCH_TO + 5,
  );
  const launched = useFlight((s) => s.launchedAt !== null && s.altitude > LAUNCH_TO - 2);
  return (
    <p className={`hint${show && launched ? ' is-visible' : ''}`} aria-hidden={!(show && launched)}>
      <ChevronUpIcon />
      {intro.hint}
    </p>
  );
}

function liveText(beat: Beat, choices: Record<string, Choice>, lanterns: number): string {
  switch (beat.kind) {
    case 'card':
      return [beat.card.title, beat.card.body, beat.card.stat].filter(Boolean).join(' ');
    case 'chips':
      return [beat.title, ...beat.chips.map((c) => c.body)].filter(Boolean).join(' ');
    case 'decision': {
      const { decision } = beat;
      const chosen = choices[decision.id];
      if (!chosen) {
        const { A, B } = decision.options;
        return `${ui.windLabel} ${decision.prompt} ${A.label}. ${B.label}.`;
      }
      return `${ui.youChose}: ${decision.options[chosen].label}. ${ui.iChose}: ${decision.options[decision.mihir].label}. ${decision.reveal}`;
    }
    case 'ending': {
      if (lanterns < ending.lanterns.length) return `${ending.intro} ${ending.instruction}`;
      const comparison = compareChoices(choices);
      return comparison.complete ? `${comparison.heading} ${comparison.note}` : ending.intro;
    }
  }
}
