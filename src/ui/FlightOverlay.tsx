import type { CSSProperties } from 'react';
import { beatIndexAt, beats, type Beat } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, ending, intro, ui, type Choice } from '../content/story';
import { compareChoices } from '../state/compare';
import { useFlight } from '../state/store';
import { Chips } from './Chips';
import { CutSequence } from './CutSequence';
import { DecisionPanel } from './DecisionPanel';
import { Ending } from './Ending';
import { LanternField } from './LanternField';
import { RevealCard } from './RevealCard';
import { StoryCard } from './StoryCard';

/**
 * Every beat is rendered once and stacked in the same slot; only the beat
 * whose altitude band holds the kite is visible. CSS fades and lifts it in.
 */
export function FlightOverlay() {
  // During a cut the altitude-based cards step aside for the cut sequence.
  const active = useFlight((s) => (s.phase === 'cut' || s.phase === 'relaunch' ? -1 : beatIndexAt(s.altitude)));
  const atEnding = useFlight((s) => s.phase === 'ending');
  const choices = useFlight((s) => s.choices);
  const lanterns = useFlight((s) => s.lanterns.length);

  return (
    <>
      <div className="beats">
        {beats.map((beat, i) => (
          <BeatView key={beat.id} beat={beat} active={i === active} />
        ))}
      </div>
      {atEnding && <LanternField />}
      <CutSequence />
      <p className="sr-only" aria-live="polite">
        {active >= 0 ? liveText(beats[active], choices, lanterns) : ''}
      </p>
    </>
  );
}

function BeatView({ beat, active }: { beat: Beat; active: boolean }) {
  const chapter = chapters[beat.chapter];
  const tone = skies[chapter.sky].card;
  const kite = kites[chapter.kite];
  const style = { '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties;

  const content = renderBeat(beat, tone);
  if (!content) return null;

  return (
    <div
      className={`beat beat--${beat.kind}${active ? ' is-active' : ''}`}
      style={style}
      aria-hidden={!active}
    >
      {content}
    </div>
  );
}

function renderBeat(beat: Beat, tone: 'light' | 'dark') {
  switch (beat.kind) {
    case 'hero':
      return <Hero />;
    case 'card':
      return <StoryCard card={beat.card} tone={tone} />;
    case 'chips':
      return <Chips chips={beat.chips} tone={tone} title={beat.title} />;
    case 'decision':
      return <FlightDecision beat={beat} tone={tone} />;
    case 'ending':
      return <Ending tone={tone} />;
  }
}

/** The open decision, or its reveal once chosen. Descending re-shows the reveal; a choice never changes. */
function FlightDecision({ beat, tone }: { beat: Extract<Beat, { kind: 'decision' }>; tone: 'light' | 'dark' }) {
  const { decision } = beat;
  const chosen = useFlight((s) => s.choices[decision.id]);
  const revealing = useFlight((s) => s.phase === 'revealing');
  const choose = useFlight((s) => s.choose);
  const continueFlight = useFlight((s) => s.continueFlight);

  if (!chosen) {
    return (
      <DecisionPanel decision={decision} tone={tone} onChoose={(choice) => choose(decision.id, choice)} />
    );
  }
  return (
    <RevealCard
      decision={decision}
      tone={tone}
      chosen={chosen}
      onContinue={revealing ? continueFlight : undefined}
    />
  );
}

function Hero() {
  const setMode = useFlight((s) => s.setMode);
  return (
    <div className="flight-hero">
      <p className="hero__eyebrow">
        <span lang="gu" className="gujarati">
          {intro.gujarati}
        </span>{' '}
        <span>{intro.gujaratiLatin}</span>
      </p>
      <h1 className="hero__title">{intro.heroTitle}</h1>
      <p className="hero__subtitle">{intro.heroSubtitle}</p>
      <p className="flight-hero__hint">{intro.hint}</p>
      <button type="button" className="text-link" onClick={() => setMode('story')}>
        {intro.readStory}
      </button>
    </div>
  );
}

function liveText(beat: Beat, choices: Record<string, Choice>, lanterns: number): string {
  switch (beat.kind) {
    case 'hero':
      return `${intro.heroTitle}. ${intro.heroSubtitle}`;
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
