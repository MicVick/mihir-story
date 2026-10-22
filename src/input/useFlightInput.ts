import { useEffect } from 'react';
import { useFlight } from '../state/store';

// Metres of altitude per pixel of input. A full flight is roughly 7,500 px
// of wheel scrolling or about 2,600 px of swiping.
const METRES_PER_WHEEL_PX = 0.12;
const METRES_PER_TOUCH_PX = 0.35;
/** Largest single wheel event, so a fast flick cannot skip a whole card. */
const MAX_WHEEL_PX = 120;
const METRES_PER_KEY = 10;
/** How far a released swipe carries, in milliseconds of its final speed. */
const FLING_MS = 140;

const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable="true"]';

/** True if the event started inside an element that is scrolling its own content. */
function insideScrollable(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Virtual scroll: wheel, trackpad, touch and keys move the target altitude
 * instead of the page, so the climb can be locked at decisions. The scene
 * damps the real altitude toward the target.
 */
export function useFlightInput(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const nudge = (metres: number) => useFlight.getState().nudge(metres);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // Pinch zoom on trackpads.
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      dy = Math.max(-MAX_WHEEL_PX, Math.min(MAX_WHEEL_PX, dy));
      // Scrolling down (or a two-finger swipe up) climbs.
      nudge(dy * METRES_PER_WHEEL_PX);
    };

    let touchY: number | null = null;
    let lastTime = 0;
    let velocity = 0; // px per ms, positive when the finger moves up

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || insideScrollable(e.target)) {
        touchY = null;
        return;
      }
      touchY = e.touches[0].clientY;
      lastTime = e.timeStamp;
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      const dy = touchY - y;
      const dt = Math.max(1, e.timeStamp - lastTime);
      velocity = 0.7 * velocity + 0.3 * (dy / dt);
      touchY = y;
      lastTime = e.timeStamp;
      nudge(dy * METRES_PER_TOUCH_PX);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      // Ignore a fling if the finger rested before lifting.
      if (e.timeStamp - lastTime < 80) nudge(velocity * FLING_MS * METRES_PER_TOUCH_PX);
      touchY = null;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const onControl = e.target instanceof Element && e.target.closest(INTERACTIVE);
      const state = useFlight.getState();
      if (e.key === 'Escape') {
        // Esc opens the spool menu, and closes it again.
        e.preventDefault();
        state.setMenuOpen(!state.menuOpen);
        return;
      }
      if ((e.key === 'p' || e.key === 'P') && !e.shiftKey) {
        state.setPresenter(!state.presenter);
        return;
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          nudge(METRES_PER_KEY * (e.key === 'PageUp' ? 5 : 1));
          break;
        case ' ':
          // Space still presses a focused button.
          if (onControl) return;
          e.preventDefault();
          nudge(METRES_PER_KEY * (e.shiftKey ? -1 : 1));
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nudge(-METRES_PER_KEY * (e.key === 'PageDown' ? 5 : 1));
          break;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled]);
}
