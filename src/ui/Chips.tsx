import type { ReactNode } from 'react';
import type { CardTone } from '../content/palette';
import type { Chapter, StoryCard } from '../content/story';
import { hasPhoto, Polaroid } from './Polaroid';

interface Props {
  chips: StoryCard[];
  tone: CardTone;
  title?: string;
  eyebrow?: ReactNode;
  photos?: Chapter['chipsPhotos'];
  /** Flight loads photos one chapter ahead; until then the row stays empty. */
  loadPhoto?: boolean;
}

/** The highlights of a chapter as a list, each marked with a small kite. */
export function Chips({ chips, tone, title, eyebrow, photos = [], loadPhoto = true }: Props) {
  const shown = loadPhoto ? photos.filter((p) => hasPhoto(p.src)) : [];
  return (
    <article className={`card card--${tone}`}>
      {eyebrow}
      {title && <h3 className="card__title">{title}</h3>}
      {shown.length > 0 && (
        <div className="photo-row">
          {shown.map((p) => (
            <Polaroid key={p.src} src={p.src} alt={p.alt} className="polaroid--small" />
          ))}
        </div>
      )}
      <ul className="chips">
        {chips.map((chip) => (
          <li key={chip.id} className="chip">
            <span className="chip__kite" aria-hidden="true" />
            <span>{splitLabel(chip.body ?? '')}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// "Amazon: Program Manager Intern..." shows "Amazon:" in bold. Text is unchanged.
function splitLabel(text: string) {
  const at = text.indexOf(': ');
  if (at === -1) return text;
  return (
    <>
      <strong>{text.slice(0, at + 1)}</strong>
      {text.slice(at + 1)}
    </>
  );
}
