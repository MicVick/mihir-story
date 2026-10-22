import { useState } from 'react';
import type { CardTone } from '../content/palette';
import type { StoryCard as StoryCardData } from '../content/story';

interface Props {
  card: StoryCardData;
  tone: CardTone;
}

export function StoryCard({ card, tone }: Props) {
  return (
    <article className={`card card--${tone}`}>
      {card.photo && <Polaroid src={card.photo} />}
      {card.title && <h3 className="card__title">{card.title}</h3>}
      {card.body && <p className="card__body">{card.body}</p>}
      {card.stat && <p className="stat">{card.stat}</p>}
    </article>
  );
}

/** White polaroid frame. Hides itself if the photo file does not exist. */
function Polaroid({ src }: { src: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <figure className="polaroid">
      <img src={src} alt="" loading="lazy" decoding="async" onError={() => setMissing(true)} />
    </figure>
  );
}
