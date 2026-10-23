import { useEffect, useRef, type CSSProperties } from 'react';
import { kites, skies } from '../content/palette';
import { chapters, menu } from '../content/story';
import { setSoundOn } from '../audio/sound';
import { useFlight } from '../state/store';
import { CloseIcon, LockIcon } from './icons';

/**
 * The spool menu: chapters (visited ones can be revisited, the rest stay
 * locked until reached), sound, presenter mode and story mode.
 */
export function SpoolMenu() {
  const open = useFlight((s) => s.menuOpen);
  const setMenuOpen = useFlight((s) => s.setMenuOpen);
  const visited = useFlight((s) => s.visited);
  const current = useFlight((s) => s.chapterIndex);
  const phase = useFlight((s) => s.phase);
  const sound = useFlight((s) => s.sound);
  const presenter = useFlight((s) => s.presenter);
  const setPresenter = useFlight((s) => s.setPresenter);
  const setMode = useFlight((s) => s.setMode);
  const resetFlight = useFlight((s) => s.resetFlight);
  const jumpTo = useFlight((s) => s.jumpTo);
  const panel = useRef<HTMLDivElement>(null);
  const tone = skies[chapters[current].sky].card;
  const kite = kites[useFlight((s) => s.kite)];
  // Jumping waits until the kite is in the air and not in the middle of a cut.
  const canJump = phase !== 'intro' && phase !== 'cut' && phase !== 'relaunch';

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('.menu__close')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel.current) return;
      // Keep focus inside the menu while it is open.
      const items = [...panel.current.querySelectorAll<HTMLElement>('button:not(:disabled)')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.getElementById('spool-button')?.focus();
    };
  }, [open]);

  if (!open) return null;

  const close = () => setMenuOpen(false);

  return (
    <>
      <div className="menu-scrim" onClick={close} aria-hidden="true" />
      <div
        id="spool-menu"
        ref={panel}
        className={`menu card card--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-heading"
        style={{ '--kite': kite.main, '--kite-on': kite.onMain } as CSSProperties}
      >
        <div className="menu__head">
          <h2 id="menu-heading" className="menu__heading">
            {menu.heading}
          </h2>
          <button type="button" className="icon-button menu__close" aria-label={menu.close} onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <ol className="menu__chapters">
          {chapters.map((c) => {
            const reached = visited.includes(c.index);
            return (
              <li key={c.index}>
                <button
                  type="button"
                  className={`menu__chapter${c.index === current ? ' is-current' : ''}`}
                  disabled={!reached || !canJump}
                  aria-current={c.index === current ? 'step' : undefined}
                  onClick={() => {
                    jumpTo(c.index);
                    close();
                  }}
                >
                  <span className="menu__num">{String(c.index).padStart(2, '0')}</span>
                  <span className="menu__title">{c.title}</span>
                  {reached ? (
                    <span className="menu__period">{c.period}</span>
                  ) : (
                    <span className="menu__period">
                      <LockIcon />
                      <span className="sr-only">{menu.locked}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="menu__settings">
          <Toggle label={menu.sound} on={sound} onChange={setSoundOn} />
          <Toggle label={menu.presenter} hint={menu.presenterHint} on={presenter} onChange={setPresenter} />
        </div>
        <button type="button" className="text-link menu__story" onClick={() => setMode('story')}>
          {menu.readStory}
        </button>
        <button type="button" className="text-link menu__story" onClick={resetFlight}>
          {menu.restartMenu}
        </button>
        <p className="menu__credits">{menu.credits}</p>
      </div>
    </>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="toggle" onClick={() => onChange(!on)}>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <span className="toggle__state" aria-hidden="true">
        {on ? menu.on : menu.off}
      </span>
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__knob" />
      </span>
    </button>
  );
}
