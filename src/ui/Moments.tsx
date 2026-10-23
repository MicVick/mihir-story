import { useEffect, useMemo, useRef, useState } from 'react';
import { playMilestone } from '../audio/sound';
import { beatIndexAt, beats, chapterAt, cutStop } from '../content/beats';
import { skies } from '../content/palette';
import { chapters, decisions, ui, type Chapter, type Milestone } from '../content/story';
import { prefersReducedMotion } from '../lib/device';
import { frame } from '../scene/frame';
import { useFlight, type FlightState } from '../state/store';

type Moment = { key: string; chapter: Chapter; /** Shown even before the kite reaches its chapter. */ ahead?: boolean } & (
  | { kind: 'chapter'; kicker: string }
  | { kind: 'milestone'; milestone: Milestone }
);

const SHOW_MS = { chapter: 3200, milestone: 4000 };
const FADE_MS = 700;

const free = (s: FlightState) => s.phase === 'flying' || s.phase === 'deciding' || s.phase === 'revealing' || s.phase === 'ending';

/**
 * Large type over the sky at the turns of the story: the chapter title as
 * each chapter begins ("A new kite" after a cut), and the numbers worth
 * stopping for, counting up beside the kite. One at a time, in order;
 * anything that has fallen behind the kite is dropped.
 */
export function Moments() {
  const [moment, setMoment] = useState<Moment | null>(null);
  const [leaving, setLeaving] = useState(false);
  const queue = useRef<Moment[]>([]);
  const shown = useRef(new Set<string>());
  const busy = useRef(false);
  /** The furthest beat the kite has been on in free flight; milestones fire when it moves past it. */
  const lastBeat = useRef(0);

  useEffect(() => {
    let timers: number[] = [];

    const next = () => {
      const s = useFlight.getState();
      // Only what still belongs to the chapter the kite is in.
      const here = chapterAt(s.altitude);
      while (queue.current.length && !queue.current[0].ahead && queue.current[0].chapter.index !== here) {
        queue.current.shift();
      }
      const item = queue.current.shift();
      if (!item) {
        busy.current = false;
        frame.momentLift = 0;
        setMoment(null);
        return;
      }
      busy.current = true;
      setLeaving(false);
      setMoment(item);
      frame.momentLift = 1;
      if (item.kind === 'milestone') {
        playMilestone();
        frame.celebrate = performance.now();
      }
      const show = SHOW_MS[item.kind];
      timers.push(
        window.setTimeout(() => {
          setLeaving(true);
          frame.momentLift = 0;
        }, show),
      );
      timers.push(window.setTimeout(next, show + FADE_MS));
    };

    const push = (item: Moment, first = false) => {
      if (shown.current.has(item.key)) return;
      shown.current.add(item.key);
      if (item.kind === 'chapter') queue.current = queue.current.filter((m) => m.kind !== 'chapter');
      if (first) queue.current.unshift(item);
      else queue.current.push(item);
      if (!busy.current) next();
    };

    const unsubscribe = useFlight.subscribe((s, prev) => {
      // A new kite climbing after a cut: title the chapter it is heading for.
      if (s.phase === 'relaunch' && prev.phase !== 'relaunch' && s.cut) {
        const chapter = chapters[chapterAt(cutStop(s.cut.id).riseTo)];
        push({ key: `chapter-${chapter.index}`, kind: 'chapter', chapter, kicker: ui.newKite, ahead: true }, true);
        return;
      }
      if (!free(s)) return;

      if (s.chapterIndex > prev.chapterIndex && free(prev)) {
        const chapter = chapters[s.chapterIndex];
        // Cut chapters have their own drama, and the last chapter opens with the lanterns.
        if (!chapter.cut && chapter.index < chapters.length - 1) push({ key: `chapter-${chapter.index}`, kind: 'chapter', chapter, kicker: `${ui.chapter} ${chapter.index}` });
      }

      // A card with a milestone, reached on the way up (also when a relaunch delivers the kite there).
      const at = beatIndexAt(s.altitude);
      const was = lastBeat.current;
      lastBeat.current = at;
      const beat = beats[at];
      if (at > was && beat.kind === 'card' && beat.card.milestone) {
        push({ key: beat.card.id, kind: 'milestone', chapter: chapters[beat.chapter], milestone: beat.card.milestone });
      }

      // A decision's reveal with a milestone, as soon as the choice is made.
      for (const decision of decisions) {
        if (decision.milestone && s.choices[decision.id] && !prev.choices[decision.id]) {
          const chapter = chapters.find((c) => c.decision?.id === decision.id)!;
          push({ key: decision.id, kind: 'milestone', chapter, milestone: decision.milestone });
        }
      }
    });

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      frame.momentLift = 0;
    };
  }, []);

  if (!moment) return null;
  const tone = skies[moment.chapter.sky].card;
  return (
    <div className={`moment moment--${moment.kind} moment--on-${tone}${leaving ? ' is-leaving' : ''}`} key={moment.key} aria-hidden="true">
      {moment.kind === 'chapter' ? (
        <>
          <p className="moment__kicker">{moment.kicker}</p>
          <p className="moment__title">{moment.chapter.title}</p>
          <p className="moment__period">{moment.chapter.period}</p>
        </>
      ) : (
        <>
          <p className="moment__kicker">
            <span className="moment__spark" />
            {ui.milestone}
          </p>
          <CountUp value={moment.milestone.value} />
          <p className="moment__label">{moment.milestone.label}</p>
        </>
      )}
    </div>
  );
}

/** Counts the digits in `value` up from zero, then shows `value` exactly as written. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value);
    const el = ref.current;
    if (!match || !el || reduced) return;
    const [, before, digits, after] = match;
    const target = parseFloat(digits.replace(/,/g, ''));
    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? `${before}${(target * eased).toFixed(decimals)}${after}` : value;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return (
    <p className="moment__value" ref={ref}>
      {value}
    </p>
  );
}
