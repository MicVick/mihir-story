// Sky and kite colours from SPEC.md Section 5.

export type SkyKey =
  | 'dawn'
  | 'earlyMorning'
  | 'morning'
  | 'overcast'
  | 'noon'
  | 'earlyAfternoon'
  | 'hazyAfternoon'
  | 'lateAfternoon'
  | 'goldenHour'
  | 'sunset'
  | 'night';

export type CardTone = 'light' | 'dark';

export interface Sky {
  top: string;
  horizon: string;
  card: CardTone;
}

export const skies: Record<SkyKey, Sky> = {
  dawn: { top: '#F4B8A0', horizon: '#FCE6D2', card: 'light' },
  earlyMorning: { top: '#9CCBE8', horizon: '#F6E7D3', card: 'light' },
  morning: { top: '#6FB3E4', horizon: '#DCEFFA', card: 'light' },
  overcast: { top: '#7F8A96', horizon: '#C7CCD2', card: 'light' },
  noon: { top: '#3F97DB', horizon: '#CFE7F7', card: 'light' },
  earlyAfternoon: { top: '#3A8BD0', horizon: '#E6EEDB', card: 'light' },
  hazyAfternoon: { top: '#8FA5B8', horizon: '#E8DCC4', card: 'light' },
  lateAfternoon: { top: '#3F7FC2', horizon: '#F3D9A4', card: 'light' },
  goldenHour: { top: '#E39A4E', horizon: '#F8D78E', card: 'light' },
  sunset: { top: '#B4505E', horizon: '#F2A65A', card: 'dark' },
  night: { top: '#0D1830', horizon: '#2A2550', card: 'dark' },
};

export interface Kite {
  main: string;
  second: string;
  /** Text colour that reads at 4.5:1 or better on the main colour. */
  onMain: string;
  /** Traditional patang pattern: 0 top diamond, 1 moon, 2 cap above the bow. */
  pattern: 0 | 1 | 2;
}

export const kites: Record<1 | 2 | 3, Kite> = {
  1: { main: '#D6336C', second: '#F2C230', onMain: '#FFFFFF', pattern: 0 },
  2: { main: '#F08C00', second: '#FFF8EE', onMain: '#1F2430', pattern: 1 },
  3: { main: '#1C7C7D', second: '#FFF8EE', onMain: '#FFFFFF', pattern: 2 },
};

/** Muted blues, greens and purples at 70% saturation. */
export const rivalKites = ['#5B7FA8', '#5E9A7A', '#86689E', '#4F8C99', '#7A86B0'];

export const lantern = { core: '#FFB547', glow: '#FF8A3D' };

export const cardStyles: Record<CardTone, { background: string; text: string }> = {
  light: { background: 'rgba(255, 252, 247, 0.82)', text: '#1F2430' },
  dark: { background: 'rgba(13, 24, 48, 0.72)', text: '#F5F1EA' },
};
