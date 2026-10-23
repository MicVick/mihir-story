import { useEffect } from 'react';
import { SLACK, SNAP } from '../scene/cutTimes';
import { useFlight } from '../state/store';
import { pauseSound, playBell, playCreak, playImpact, playShout, playSnap } from './sound';

/** One-off sounds tied to the story: the creak at decisions, the cuts and their impact, the lantern bells. */
export function useSoundCues() {
  useEffect(() => {
    const timers: number[] = [];
    const unsubscribe = useFlight.subscribe((s, prev) => {
      if (s.phase === 'deciding' && prev.phase !== 'deciding') playCreak();
      if (s.cut && s.cut.startedAt !== prev.cut?.startedAt && s.cut.id === 'snap') {
        const elapsed = performance.now() - s.cut.startedAt;
        timers.push(window.setTimeout(playShout, Math.max(0, SNAP.cross * 1000 - elapsed)));
        timers.push(window.setTimeout(playSnap, Math.max(0, SNAP.snap * 1000 - elapsed)));
        timers.push(window.setTimeout(() => playImpact(1), Math.max(0, SNAP.snap * 1000 - elapsed)));
      }
      if (s.cut && s.cut.startedAt !== prev.cut?.startedAt && s.cut.id === 'slack') {
        const elapsed = performance.now() - s.cut.startedAt;
        timers.push(window.setTimeout(playSnap, Math.max(0, SLACK.snap * 1000 - elapsed)));
        timers.push(window.setTimeout(() => playImpact(0.85), Math.max(0, SLACK.snap * 1000 - elapsed)));
      }
      if (s.lanterns.length > prev.lanterns.length) playBell(s.lanterns[s.lanterns.length - 1]);
    });
    const onVisibility = () => pauseSound(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
