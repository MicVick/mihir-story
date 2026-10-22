import type { CSSProperties } from 'react';
import { kites, skies } from '../content/palette';
import { chapters, ending, intro, ui, type Chapter } from '../content/story';
import { useFlight } from '../state/store';
import { Chips } from './Chips';
import { DecisionPanel } from './DecisionPanel';
import { EndingActions, EndingComparison } from './Ending';
import { RevealCard } from './RevealCard';
import { StoryCard } from './StoryCard';

/** The linear, readable version of the flight. Same chapters, cards and decisions. */
export function StoryMode() {
  return (
    <main className="story">
      {chapters.map((chapter) => (
        <ChapterSection key={chapter.index} chapter={chapter} />
      ))}
    </main>
  );
}

function ChapterSection({ chapter }: { chapter: Chapter }) {
  const sky = skies[chapter.sky];
  const next = chapters[chapter.index + 1];
  const kite = kites[chapter.kite];
  const tone = sky.card;
  const headingId = `chapter-${chapter.index}`;

  const style = {
    '--sky-top': sky.top,
    '--sky-horizon': sky.horizon,
    '--sky-next': next ? skies[next.sky].top : sky.top,
    '--kite': kite.main,
    '--kite-on': kite.onMain,
  } as CSSProperties;

  return (
    <section className={`chapter chapter--${tone}`} style={style} aria-labelledby={headingId}>
      <div className="chapter__inner">
        {chapter.index === 0 && <Hero />}

        <header className={`card card--${tone} chapter__header`}>
          <p className="chapter__period">{chapter.period}</p>
          <h2 id={headingId} className="chapter__title">
            {chapter.title}
          </h2>
        </header>

        {chapter.cut === 'snap' && (
          <p className={`card card--${tone} shout`} lang="gu-Latn">
            {ui.rivalShout}
          </p>
        )}

        {chapter.chips && chapter.chipsTitle && (
          <Chips chips={chapter.chips} tone={tone} title={chapter.chipsTitle} />
        )}

        {chapter.cards.map((card) => (
          <StoryCard key={card.id} card={card} tone={tone} />
        ))}

        {chapter.chips && !chapter.chipsTitle && <Chips chips={chapter.chips} tone={tone} />}

        {chapter.decision && <StoryDecision chapter={chapter} />}

        {chapter.index === chapters.length - 1 && <StoryEnding tone={tone} />}
      </div>
    </section>
  );
}

function Hero() {
  return (
    <div className="hero">
      <p className="hero__eyebrow">
        <span lang="gu" className="gujarati">
          {intro.gujarati}
        </span>{' '}
        <span>{intro.gujaratiLatin}</span>
      </p>
      <h1 className="hero__title">{intro.heroTitle}</h1>
      <p className="hero__subtitle">{intro.heroSubtitle}</p>
    </div>
  );
}

function StoryDecision({ chapter }: { chapter: Chapter }) {
  const decision = chapter.decision!;
  const tone = skies[chapter.sky].card;
  const chosen = useFlight((s) => s.choices[decision.id]);
  const choose = useFlight((s) => s.choose);

  return (
    <>
      <DecisionPanel
        decision={decision}
        tone={tone}
        chosen={chosen}
        onChoose={(choice) => choose(decision.id, choice)}
      />
      <div aria-live="polite" className="live">
        {chosen && <RevealCard decision={decision} tone={tone} chosen={chosen} />}
      </div>
    </>
  );
}

function StoryEnding({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <>
      <p className={`card card--${tone} ending__intro`}>{ending.intro}</p>

      <ul className="lanterns">
        {ending.lanterns.map((lantern) => (
          <li key={lantern.id} className="lantern">
            <span className="lantern__light" aria-hidden="true" />
            <span className="lantern__text">{lantern.text}</span>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="live">
        <EndingComparison tone={tone} />
      </div>

      <p className="closing">{ending.closing}</p>

      <EndingActions inStory />
    </>
  );
}
