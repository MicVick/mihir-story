import type { CardTone } from '../content/palette';
import type { StoryCard } from '../content/story';

interface Props {
  chips: StoryCard[];
  tone: CardTone;
  title?: string;
}

/** Story-mode version of the small labelled kites that fly beside Mihir's kite. */
export function Chips({ chips, tone, title }: Props) {
  return (
    <article className={`card card--${tone}`}>
      {title && <h3 className="card__title">{title}</h3>}
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
