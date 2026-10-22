import type { CSSProperties } from 'react';
import { beatIndexAt, beats, type Beat } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, intro } from '../content/story';
import { useFlight } from '../state/store';
import { Chips } from './Chips';
import { StoryCard } from './StoryCard';

/**
 * Every beat is rendered once and stacked in the same slot; only the beat
 * whose altitude band holds the kite is visible. CSS fades and lifts it in.
 */
export function FlightOverlay() {
  const active = useFlight((s) => beatIndexAt(s.altitude));

  return (
    <>
      <div className="beats">
        {beats.map((beat, i) => (
          <BeatView key={beat.id} beat={beat} active={i === active} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {liveText(beats[active])}
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
    // Decisions arrive in Phase 3, the lantern ending in Phases 3 and 4.
    case 'decision':
    case 'ending':
      return null;
  }
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

function liveText(beat: Beat): string {
  switch (beat.kind) {
    case 'hero':
      return `${intro.heroTitle}. ${intro.heroSubtitle}`;
    case 'card':
      return [beat.card.title, beat.card.body, beat.card.stat].filter(Boolean).join(' ');
    case 'chips':
      return [beat.title, ...beat.chips.map((c) => c.body)].filter(Boolean).join(' ');
    default:
      return '';
  }
}
