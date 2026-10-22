import type { CardTone } from '../content/palette';
import { ui } from '../content/story';
import type { Comparison as ComparisonData } from '../state/compare';

interface Props {
  comparison: ComparisonData;
  tone: CardTone;
}

export function Comparison({ comparison, tone }: Props) {
  return (
    <article className={`card card--${tone} comparison`}>
      <h3 className="card__title">{comparison.heading}</h3>
      <p className="card__body">{comparison.note}</p>
      <table className="comparison__table">
        <thead>
          <tr>
            <th scope="col">{ui.tableDecision}</th>
            <th scope="col">{ui.tableYours}</th>
            <th scope="col">{ui.tableMine}</th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.id} className={row.match ? 'is-match' : undefined}>
              <th scope="row">{row.name}</th>
              <td>{row.yours}</td>
              <td>{row.mine}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
