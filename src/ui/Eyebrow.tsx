import type { Chapter } from '../content/story';

/** The chapter line at the top of a card in flight: kite mark, number, title and period. */
export function Eyebrow({ chapter }: { chapter: Chapter }) {
  return (
    <p className="eyebrow">
      <span className="eyebrow__kite" aria-hidden="true" />
      <span className="eyebrow__num">{String(chapter.index).padStart(2, '0')}</span>
      <span className="eyebrow__title">{chapter.title}</span>
      <span className="eyebrow__period">{chapter.period}</span>
    </p>
  );
}
