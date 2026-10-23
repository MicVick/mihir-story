import type { ReactNode } from 'react';
import type { CardTone } from '../content/palette';
import type { StoryCard as StoryCardData } from '../content/story';
import { hasPhoto, Polaroid } from './Polaroid';

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
      {hasPhoto(card.photo) && loadPhoto && <Polaroid src={card.photo} alt={card.photoAlt ?? ''} ratio={card.photoRatio} />}
      {card.title &&
        (hasPhoto(card.logo) ? (
          <div className="card__head">
            <img className="card__logo" src={`/photos/${card.logo}`} alt={card.logoAlt ?? ''} width={52} height={52} />
            <h3 className="card__title">{card.title}</h3>
          </div>
        ) : (
          <h3 className="card__title">{card.title}</h3>
        ))}
      {card.body && <p className="card__body">{card.body}</p>}
      {card.stat && <p className="stat">{card.stat}</p>}
      {children}
    </article>
  );
}
