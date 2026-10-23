import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { setSoundOn } from '../audio/sound';
import { kites } from '../content/palette';
import { intro } from '../content/story';
import { prefersReducedMotion } from '../lib/device';
import { useFlight } from '../state/store';
import { HoldButton } from './HoldButton';
import { KiteGlyph, SoundIcon } from './icons';

const kite = kites[1];

/**
 * The opening screen over the rooftops at dawn: ઉત્તરાયણ, the name, the
 * line, and "Hold to launch". It is part of the first bundle, so the title
 * paints while the 3D scene is still loading; the launch button appears once
 * the scene is ready. It fades away as the kite lifts off.
 */
export function IntroHero() {
  const visible = useFlight((s) => s.phase === 'intro');
  const ready = useFlight((s) => s.sceneReady);
  const launch = useFlight((s) => s.launch);
  const setMode = useFlight((s) => s.setMode);
  const sound = useFlight((s) => s.sound);
  const reduced = useMemo(prefersReducedMotion, []);
  const [keepFlying, setKeepFlying] = useState(false);
  // If index.html already showed the title, take its place without animating in again.
  const [fromShell] = useState(() => document.getElementById('shell') !== null);
  const root = useRef<HTMLElement>(null);

  // Once the kite is up, the faded hero must not take focus or clicks.
  useEffect(() => {
    if (root.current) root.current.inert = !visible;
  }, [visible]);

  return (
    <section
      className={`intro${visible ? ' is-visible' : ''}${fromShell ? ' intro--instant' : ''}`}
      style={{ '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties}
      ref={root}
      aria-hidden={!visible}
    >
      <p className="intro__festival">
        <span lang="gu" className="gujarati">
          {intro.gujarati}
        </span>
        <span className="intro__latin">{intro.gujaratiLatin}</span>
      </p>
      <h1 className="intro__title">{intro.heroTitle}</h1>
      <p className="intro__subtitle">{intro.heroSubtitle}</p>
      <div className="intro__actions">
        {ready ? (
          <HoldButton label={intro.launch} onComplete={launch} />
        ) : (
          <p className="intro__loading" role="status">
            <KiteGlyph className="intro__loading-kite" />
            {intro.loader}
          </p>
        )}
        <div className="intro__links">
          <button type="button" className="text-link intro__music" aria-pressed={sound} onClick={() => setSoundOn(!sound)}>
            <SoundIcon on={sound} />
            {sound ? intro.musicOn : intro.music}
          </button>
          <button type="button" className="text-link" onClick={() => setMode('story')}>
            {intro.readStory}
          </button>
        </div>
      </div>
      {reduced && !keepFlying && (
        <div className="intro__motion card card--light" role="note">
          <p>{intro.reducedMotion}</p>
          <div className="intro__motion-actions">
            <button type="button" className="pill pill--primary" onClick={() => setMode('story')}>
              {intro.reducedMotionRead}
            </button>
            <button type="button" className="pill pill--ghost" onClick={() => setKeepFlying(true)}>
              {intro.reducedMotionStay}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
