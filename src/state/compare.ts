import { decisions, ending, type Choice } from '../content/story';

export interface ComparisonRow {
  id: string;
  name: string;
  yours?: string;
  mine: string;
  match: boolean;
}

export interface Comparison {
  score: number;
  complete: boolean;
  heading: string;
  note: string;
  rows: ComparisonRow[];
}

export function noteForScore(score: number): string {
  if (score >= 5) return ending.comparisonNotes.all;
  if (score >= 3) return ending.comparisonNotes.close;
  return ending.comparisonNotes.far;
}

export function compareChoices(choices: Record<string, Choice>): Comparison {
  const rows = decisions.map((d) => {
    const picked = choices[d.id];
    return {
      id: d.id,
      name: d.name,
      yours: picked ? d.options[picked].label : undefined,
      mine: d.options[d.mihir].label,
      match: picked === d.mihir,
    };
  });
  const score = rows.filter((r) => r.match).length;
  return {
    score,
    complete: rows.every((r) => r.yours !== undefined),
    heading: ending.comparisonHeading.replace('{n}', String(score)),
    note: noteForScore(score),
    rows,
  };
}
