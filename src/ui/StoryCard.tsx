import { useState, type ReactNode } from 'react';
import photos from 'virtual:photos';
import type { CardTone } from '../content/palette';
import type { StoryCard as StoryCardData } from '../content/story';

interface Props {
  card: StoryCardData;
  tone: CardTone;
  /** Chapter line shown above the text in flight. */
  eyebrow?: ReactNode;
  /** Flight loads photos one chapter ahead; until then the slot stays empty. */
  loadPhoto?: boolean;
  /** Actions shown at the foot of the card, such as Continue in a cut. */
  children?: ReactNode;
}

export function StoryCard({ card, tone, eyebrow, loadPhoto = true, children }: Props) {
  return (
    <article className={`card card--${tone}`}>
      {eyebrow}
      {card.photo && photos.includes(card.photo) && loadPhoto && <Polaroid src={card.photo} alt={card.photoAlt ?? ''} />}
      {card.title && <h3 className="card__title">{card.title}</h3>}
      {card.body && <p className="card__body">{card.body}</p>}
      {card.stat && <p className="stat">{card.stat}</p>}
      {children}
    </article>
  );
}

/** White polaroid frame. Only rendered when the photo exists; hides itself if it still fails to load. */
function Polaroid({ src, alt }: { src: string; alt: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <figure className="polaroid">
      <img src={`/photos/${src}`} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />
    </figure>
  );
}
