import { Fragment, type CSSProperties } from 'react';
import { kites, skies } from '../content/palette';
import { chapters, ending, intro, ui, type Chapter, type Milestone } from '../content/story';
import { useFlight } from '../state/store';
import { Chips } from './Chips';
import { DecisionPanel } from './DecisionPanel';
import { EndingActions, EndingComparison } from './Ending';
import { RevealCard } from './RevealCard';
import { KiteGlyph } from './icons';
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
    <section className={`chapter chapter--${tone}${chapter.cut ? ' chapter--setback' : ''}`} style={style} aria-labelledby={headingId}>
      <div className="chapter__inner">
        {chapter.index === 0 && <Hero />}

        <header className={`card card--${tone} chapter__header`}>
          <span className="chapter__num" aria-hidden="true">
            {String(chapter.index).padStart(2, '0')}
          </span>
          <div className="chapter__heading">
            <p className="chapter__period">{chapter.period}</p>
            <h2 id={headingId} className="chapter__title">
              {chapter.title}
            </h2>
          </div>
        </header>

        {chapter.cut === 'snap' && (
          <p className={`card card--${tone} shout`} lang="gu-Latn">
            {ui.rivalShout}
          </p>
        )}

        {chapter.chips && chapter.chipsFirst && <Chips chips={chapter.chips} tone={tone} title={chapter.chipsTitle} />}

        {chapter.cards.map((card) =>
          chapter.cut ? (
            // A setback reads as plain text on the dark band, not as a card.
            <div key={card.id} className="setback-story">
              {card.title && <h3 className="setback-story__title">{card.title}</h3>}
              <p className="setback-story__text">{card.body}</p>
            </div>
          ) : (
            <Fragment key={card.id}>
              <StoryCard card={card} tone={tone} />
              {card.milestone && <MilestoneMark milestone={card.milestone} />}
            </Fragment>
          ),
        )}

        {chapter.chips && !chapter.chipsFirst && <Chips chips={chapter.chips} tone={tone} title={chapter.chipsTitle} />}

        {chapter.decision && <StoryDecision chapter={chapter} />}

        {chapter.index === chapters.length - 1 && <StoryEnding tone={tone} />}
      </div>
    </section>
  );
}

/** A number worth stopping for, set large between the cards. */
function MilestoneMark({ milestone }: { milestone: Milestone }) {
  return (
    <p className="milestone-mark">
      <span className="milestone-mark__kicker">{ui.milestone}</span>
      <span className="milestone-mark__value">{milestone.value}</span>
      <span className="milestone-mark__label">{milestone.label}</span>
    </p>
  );
}

function Hero() {
  return (
    <div className="story-hero">
      <p className="intro__festival">
        <span lang="gu" className="gujarati">
          {intro.gujarati}
        </span>
        <span className="intro__latin">{intro.gujaratiLatin}</span>
      </p>
      <h1 className="intro__title">{intro.heroTitle}</h1>
      <p className="intro__subtitle">{intro.heroSubtitle}</p>
      <KiteGlyph className="story-hero__kite" />
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
        {chosen && decision.milestone && <MilestoneMark milestone={decision.milestone} />}
      </div>
    </>
  );
}

function StoryEnding({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <>
      <p className={`card card--${tone} ending__intro ending__line`}>{ending.intro}</p>

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
