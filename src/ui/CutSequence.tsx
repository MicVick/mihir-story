import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { cutStop } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, ui, type Chapter } from '../content/story';
import { prefersReducedMotion } from '../lib/device';
import { SLACK, SNAP } from '../scene/cutTimeline';
import { useFlight, type CutState } from '../state/store';
import { DecisionPanel } from './DecisionPanel';
import { Eyebrow } from './Eyebrow';
import { HoldButton } from './HoldButton';
import { ArrowIcon } from './icons';
import { RevealCard } from './RevealCard';

/** How long "Kai po che!" stays up after the strings cross. */
const SHOUT_MS = 2600;

/**
 * The HTML side of a cut. Cut 1: "Kai po che!" as the rival crosses, a flash
 * at the snap, the screen closing in as the kite falls, then the setback told
 * full-screen and "Re-tie the string". Cut 2: the string goes slack and the
 * screen dims, the stall told full-screen, then Decision 4 with both kites on
 * the rooftop, the reveal and the launch.
 */
export function CutSequence() {
  const cut = useFlight((s) => (s.phase === 'cut' ? s.cut : null));
  if (!cut) return null;

  const chapter = chapters[cutStop(cut.id).chapter];
  const tone = skies[chapter.sky].card;
  const kite = kites[chapter.kite];
  const style = { '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties;

  const telling = cut.step >= 1 && cut.step <= chapter.cards.length;

  return (
    <>
      <SetbackMode on={cut.step <= chapter.cards.length} />
      <ImpactFx cut={cut} />
      {cut.id === 'snap' && <Shout startedAt={cut.startedAt} />}
      {telling && (
        <div key={cut.step} className="cut-step cut-step--setback" style={style}>
          <CutStep cut={cut} chapter={chapter} tone={tone} />
        </div>
      )}
      {cut.step > chapter.cards.length && (
        <div className="beats">
          <div
            key={cut.step}
            // The rooftop decision gets the taller sheet on mobile so both options show in full.
            className="beat is-active cut-step beat--decision"
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
  const eyebrow = <Eyebrow chapter={chapter} />;

  if (card) {
    const last = cut.step === cards.length;
    return (
      <Setback chapter={chapter} first={cut.step === 1} title={card.title} body={card.body ?? ''}>
        {cut.id === 'snap' && last ? (
          <HoldButton label={ui.retie} onComplete={relaunch} />
        ) : (
          <button type="button" className="pill pill--light continue" onClick={advanceCut} autoFocus>
            {ui.continue}
            <ArrowIcon />
          </button>
        )}
      </Setback>
    );
  }

  const decision = chapter.decision;
  if (!decision) return null;
  if (!chosen) {
    return (
      <DecisionPanel decision={decision} tone={tone} eyebrow={eyebrow} onChoose={(choice) => choose(decision.id, choice)} />
    );
  }
  // Whatever the visitor picked, the reveal shows the new kite, and Continue launches it.
  return <RevealCard decision={decision} tone={tone} chosen={chosen} eyebrow={eyebrow} onContinue={relaunch} />;
}

/** Splits a paragraph into sentences, so they can arrive one at a time. */
const sentences = (text: string) => text.match(/[^.!?]+[.!?]+['")]*\s*/g) ?? [text];

/**
 * A setback, told full-screen: the scene dims and greys behind, the chapter
 * title stands large, and the text arrives a sentence at a time.
 */
function Setback({ chapter, first, title, body, children }: { chapter: Chapter; first: boolean; title?: string; body: string; children: ReactNode }) {
  const lines = useMemo(() => sentences(body), [body]);
  return (
    <section className="setback" aria-labelledby="setback-title" style={{ '--lines': lines.length } as CSSProperties}>
      <div className="setback__inner">
        <header className={`setback__head${first ? '' : ' setback__head--small'}`}>
          <p className="setback__kicker">
            <span className="setback__break" aria-hidden="true" />
            {ui.setback} · {chapter.period}
          </p>
          <h2 className="setback__title" id="setback-title">
            {chapter.title}
          </h2>
        </header>
        {title && <h3 className="setback__subtitle">{title}</h3>}
        <p className="setback__text">
          {lines.map((line, i) => (
            <span key={i} className="setback__line" style={{ '--i': i } as CSSProperties}>
              {keepHyphenated(line)}
            </span>
          ))}
        </p>
        <div className="setback__action">{children}</div>
      </div>
    </section>
  );
}

/** Keeps words like "COVID-19" on one line at this large size. */
const keepHyphenated = (line: string) =>
  line.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );

/** While the kite falls and the setback is told, the page chrome steps back. */
function SetbackMode({ on }: { on: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle('is-setback', on);
    return () => document.documentElement.classList.remove('is-setback');
  }, [on]);
  return null;
}

/**
 * The moment of the cut. Snap: a white flash as the string parts, then the
 * edges of the screen close in while the kite falls. Slack: no flash, the
 * screen slowly dims as the string loses its pull.
 */
function ImpactFx({ cut }: { cut: CutState }) {
  const reduced = useMemo(prefersReducedMotion, []);
  const [stage, setStage] = useState<'none' | 'hit' | 'falling'>('none');
  useEffect(() => {
    const at = (cut.id === 'snap' ? SNAP.snap : SLACK.slack) * 1000 - (performance.now() - cut.startedAt);
    const timers = [
      window.setTimeout(() => setStage('hit'), Math.max(0, at)),
      window.setTimeout(() => setStage('falling'), Math.max(0, at + 450)),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [cut.id, cut.startedAt]);
  if (stage === 'none' || cut.step > 0) return null;
  return (
    <>
      {cut.id === 'snap' && !reduced && <div className={`impact-flash${stage === 'hit' ? ' is-on' : ''}`} aria-hidden="true" />}
      <div className={`impact-vignette impact-vignette--${cut.id}`} aria-hidden="true" />
    </>
  );
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
