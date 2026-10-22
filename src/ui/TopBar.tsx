import type { CSSProperties } from 'react';
import { cutStop, MAX_ALTITUDE } from '../content/beats';
import { kites, skies } from '../content/palette';
import { chapters, intro, menu } from '../content/story';
import { setSoundOn } from '../audio/sound';
import { useFlight } from '../state/store';
import { SoundIcon, SpoolIcon } from './icons';

const RING = 2 * Math.PI * 18;

/**
 * Name and chapter on the left; presenter badge, sound and the spool (firki)
 * on the right. The thread ring around the spool shrinks as the kite climbs.
 */
export function TopBar() {
  // In a cut the kite is back on the terrace, but the story is still in the cut's chapter.
  const chapter = chapters[useFlight((s) => (s.cut ? cutStop(s.cut.id).chapter : s.chapterIndex))];
  const phase = useFlight((s) => s.phase);
  const sound = useFlight((s) => s.sound);
  const presenter = useFlight((s) => s.presenter);
  const menuOpen = useFlight((s) => s.menuOpen);
  const setMenuOpen = useFlight((s) => s.setMenuOpen);
  // Rounded so the bar re-renders a few hundred times per flight, not every frame.
  const progress = useFlight(
    (s) => Math.round((Math.max(s.altitude, s.cut ? cutStop(s.cut.id).altitude : 0) / MAX_ALTITUDE) * 200) / 200,
  );
  const tone = skies[chapter.sky].card;
  const kite = kites[useFlight((s) => s.kite)];
  const style = { '--kite': kite.main, '--thread': RING * progress } as CSSProperties;

  return (
    <header className={`topbar topbar--${tone}${phase === 'intro' ? ' is-intro' : ''}`} style={style}>
      <div className="topbar__where">
        <span className="topbar__name">{intro.heroTitle}</span>
        <span className="topbar__chapter" aria-live="off">
          <span className="topbar__num">{String(chapter.index).padStart(2, '0')}</span>
          {chapter.title}
        </span>
      </div>
      <div className="topbar__tools">
        {presenter && <span className="topbar__badge">{menu.presenter}</span>}
        <button
          type="button"
          className="icon-button"
          aria-label={sound ? menu.soundOff : menu.soundOn}
          aria-pressed={sound}
          onClick={() => setSoundOn(!sound)}
        >
          <SoundIcon on={sound} />
        </button>
        <button
          type="button"
          id="spool-button"
          className="icon-button spool"
          aria-label={menu.open}
          aria-expanded={menuOpen}
          aria-controls="spool-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="spool__ring" viewBox="0 0 40 40" aria-hidden="true">
            <circle className="spool__track" cx="20" cy="20" r="18" />
            <circle className="spool__thread" cx="20" cy="20" r="18" style={{ strokeDasharray: RING }} />
          </svg>
          <SpoolIcon />
          <span className="sr-only">
            {menu.progress}: {Math.round(progress * 100)}%
          </span>
        </button>
      </div>
    </header>
  );
}
