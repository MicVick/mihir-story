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
      {/* Five small kites, lit for each choice that matched. The heading says the same in words. */}
      <div className="comparison__kites" aria-hidden="true">
        {comparison.rows.map((row) => (
          <span key={row.id} className={`comparison__kite${row.match ? ' is-match' : ''}`} />
        ))}
      </div>
      <h3 className="comparison__heading">{comparison.heading}</h3>
      <p className="comparison__note">{comparison.note}</p>
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
              <td data-label={ui.tableYours}>{row.yours}</td>
              <td data-label={ui.tableMine}>{row.mine}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
