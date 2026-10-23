// Background music, made in the browser: a tanpura drone with a santoor-like
// melody over it. Both instruments are plucked strings (Karplus-Strong), so
// nothing has to download. The melody follows the story:
//   intro  the drone, with a phrase now and then
//   day    a bright five-note scale (S R G P D) while the kite climbs
//   cut    the melody thins out to slow, darker phrases (S r g P d)
//   night  a softer evening scale with the raised fourth (S R G M# P D N) for the lanterns
// Everything is in D: the drone plays Pa, Sa, Sa and low Sa.

export type Mood = 'intro' | 'day' | 'cut' | 'night';

/** A phrase: [semitones above the melody's Sa, length in beats]. */
type Phrase = [number, number][];

const MELODY_SA = 293.66; // D4
const DRONE = [110, 146.83, 146.83, 73.42]; // Pa (A2), Sa (D3), Sa, low Sa (D2)
const DRONE_GAPS = [1.2, 1.2, 1.2, 2.1];

const PHRASES: Record<Exclude<Mood, 'intro'>, Phrase[]> = {
  day: [
    [[4, 0.5], [7, 0.5], [9, 0.5], [12, 1.5], [9, 0.5], [7, 0.5], [4, 2]],
    [[0, 0.5], [2, 0.5], [4, 1], [2, 0.5], [0, 0.5], [-3, 1], [0, 2.5]],
    [[7, 0.5], [9, 0.5], [12, 0.5], [14, 0.5], [16, 1], [14, 0.5], [12, 2.5]],
    [[4, 1], [2, 0.5], [0, 0.5], [2, 0.5], [4, 0.5], [7, 1], [4, 2]],
    [[9, 0.5], [12, 0.5], [9, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [0, 2.5]],
    [[-5, 0.5], [-3, 0.5], [0, 1], [2, 0.5], [4, 1.5], [2, 0.5], [0, 2]],
    [[12, 1], [9, 0.5], [7, 0.5], [9, 1], [7, 0.5], [4, 0.5], [2, 1], [4, 2]],
  ],
  cut: [
    [[7, 2], [8, 1], [7, 1], [3, 2], [1, 1], [0, 4]],
    [[0, 1.5], [1, 0.5], [3, 2], [1, 1], [0, 4]],
    [[-4, 1], [-5, 1], [0, 2], [3, 1.5], [1, 0.5], [0, 4]],
  ],
  night: [
    [[-1, 0.5], [2, 0.5], [4, 1], [6, 1], [4, 0.5], [2, 0.5], [0, 2.5]],
    [[4, 0.5], [6, 0.5], [7, 1], [9, 0.5], [11, 0.5], [12, 2.5]],
    [[12, 0.5], [11, 0.5], [9, 0.5], [7, 0.5], [6, 0.5], [4, 1], [2, 0.5], [0, 2.5]],
    [[7, 1], [6, 0.5], [4, 0.5], [6, 1], [9, 1], [7, 2.5]],
    [[2, 0.5], [4, 0.5], [6, 0.5], [7, 0.5], [6, 1], [4, 0.5], [2, 0.5], [-1, 0.5], [0, 2.5]],
  ],
};

/** Seconds per beat, and the rest between phrases in beats [min, max]. */
const PACE: Record<Mood, { beat: number; rest: [number, number] }> = {
  intro: { beat: 0.72, rest: [8, 14] },
  day: { beat: 0.62, rest: [4, 8] },
  cut: { beat: 0.95, rest: [6, 10] },
  night: { beat: 0.78, rest: [4, 7] },
};

/** How bright the whole mix is per mood (lowpass cutoff in Hz). */
const TONE: Record<Mood, number> = { intro: 6000, day: 9000, cut: 1300, night: 4200 };

interface Note {
  time: number;
  semi: number;
  velocity: number;
}

export interface Music {
  setMood: (mood: Mood, at?: number) => void;
  /** Schedules every note that starts before `until` (seconds on the audio clock). */
  scheduleUntil: (until: number) => void;
  stop: () => void;
}

/**
 * A plucked string, rendered once and reused. Returns the buffer and the
 * playback rate that corrects the integer delay length to the exact pitch.
 */
function pluckBuffer(ctx: BaseAudioContext, freq: number, seconds: number, t60: number, brightness: number) {
  const sr = ctx.sampleRate;
  const period = Math.max(2, Math.round(sr / freq));
  const length = Math.floor(sr * seconds);
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);

  // Excitation: one period of noise, softened by a one-pole lowpass.
  let lp = 0;
  let mean = 0;
  for (let i = 0; i < period; i++) {
    lp += brightness * (Math.random() * 2 - 1 - lp);
    out[i] = lp;
    mean += lp;
  }
  mean /= period;
  for (let i = 0; i < period; i++) out[i] -= mean;

  // The string: average neighbouring samples one period back, losing a little each pass.
  const damping = Math.pow(10, -3 / (t60 * freq));
  for (let i = period; i < length; i++) {
    const a = out[i - period];
    const b = i - period - 1 >= 0 ? out[i - period - 1] : a;
    out[i] = damping * 0.5 * (a + b);
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const fade = Math.floor(sr * 0.08);
  for (let i = 0; i < length; i++) {
    const tail = i > length - fade ? (length - i) / fade : 1;
    out[i] = (out[i] / (peak || 1)) * tail;
  }
  return { buffer, rate: freq / (sr / (period + 0.5)) };
}

/** A soft room: stereo noise with an exponential tail. */
function roomImpulse(ctx: BaseAudioContext, seconds: number) {
  const sr = ctx.sampleRate;
  const length = Math.floor(sr * seconds);
  const buffer = ctx.createBuffer(2, length, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / sr;
      lp += 0.4 * (Math.random() * 2 - 1 - lp);
      data[i] = lp * Math.exp((-6.9 * t) / seconds) * Math.min(1, t / 0.01);
    }
  }
  return buffer;
}

export function createMusic(ctx: BaseAudioContext, destination: AudioNode): Music {
  const out = ctx.createGain();
  out.gain.value = 1;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = TONE.intro;
  tone.Q.value = 0.5;
  tone.connect(out).connect(destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 3.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  reverb.connect(wet).connect(tone);

  const droneBus = ctx.createGain();
  droneBus.gain.value = 0.6;
  droneBus.connect(tone);
  droneBus.connect(reverb);

  const melodyBus = ctx.createGain();
  melodyBus.gain.value = 0.85;
  melodyBus.connect(tone);
  melodyBus.connect(reverb);

  const cache = new Map<string, ReturnType<typeof pluckBuffer>>();
  const pluck = (kind: 'tanpura' | 'santoor', freq: number) => {
    const key = `${kind}:${freq.toFixed(2)}`;
    let entry = cache.get(key);
    if (!entry) {
      entry =
        kind === 'tanpura'
          ? pluckBuffer(ctx, freq, 6, 7, 0.85)
          : pluckBuffer(ctx, freq, 3.4, 2.2 + 220 / freq, 0.55);
      cache.set(key, entry);
    }
    return entry;
  };

  const pan = (value: number, into: AudioNode) => {
    if (!('createStereoPanner' in ctx)) return into;
    const node = ctx.createStereoPanner();
    node.pan.value = value;
    node.connect(into);
    return node;
  };

  /** Tanpura: a bright pluck whose overtones sweep down, the shimmer of the jawari bridge. */
  function playDrone(freq: number, time: number, velocity: number) {
    const { buffer, rate } = pluck('tanpura', freq);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = velocity;
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = 1600;
    const shimmer = ctx.createBiquadFilter();
    shimmer.type = 'bandpass';
    shimmer.Q.value = 5;
    shimmer.frequency.setValueAtTime(2600, time);
    shimmer.frequency.exponentialRampToValueAtTime(650, time + 4);
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.9;
    const target = pan(freq < 100 ? 0 : freq < 120 ? -0.25 : 0.25, droneBus);
    source.connect(gain);
    gain.connect(body).connect(target);
    gain.connect(shimmer).connect(shimmerGain).connect(target);
    source.start(time);
    source.stop(time + buffer.duration / rate);
  }

  /** Santoor: two strings per note, a hair apart in pitch, struck together. */
  function playNote(semi: number, time: number, velocity: number) {
    const freq = MELODY_SA * Math.pow(2, semi / 12);
    const { buffer, rate } = pluck('santoor', freq);
    [-4, 4].forEach((cents, i) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate * Math.pow(2, cents / 1200);
      const gain = ctx.createGain();
      gain.gain.value = velocity * 0.5;
      source.connect(gain).connect(pan(i ? 0.18 : -0.18, melodyBus));
      source.start(time + i * 0.006);
      source.stop(time + 3.4);
    });
  }

  let mood: Mood = 'intro';
  let droneAt = ctx.currentTime + 0.1;
  let droneStep = 0;
  let phraseAt = ctx.currentTime + 2.5;
  let pending: Note[] = [];
  let lastPhrase = -1;

  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  function nextPhrase(start: number) {
    const set = PHRASES[mood === 'intro' ? 'day' : mood];
    let pick = Math.floor(Math.random() * set.length);
    if (pick === lastPhrase) pick = (pick + 1) % set.length;
    lastPhrase = pick;
    const { beat, rest } = PACE[mood];
    let t = start;
    set[pick].forEach(([semi, beats], i) => {
      const accent = i === 0 ? 1 : rand(0.72, 0.92);
      // Now and then a quick grace note from above, as a santoor player would add.
      if (beats >= 1 && i > 0 && Math.random() < 0.2) {
        pending.push({ time: t - 0.07, semi: semi + 2, velocity: accent * 0.4 });
      }
      pending.push({ time: t, semi, velocity: accent * (mood === 'cut' ? 0.7 : 1) });
      t += beats * beat * rand(0.97, 1.03);
    });
    phraseAt = t + rand(rest[0], rest[1]) * beat;
  }

  function scheduleUntil(until: number) {
    const now = ctx.currentTime;
    if (droneAt < now - 1) droneAt = now + 0.05;
    while (droneAt < until) {
      const i = droneStep % DRONE.length;
      playDrone(DRONE[i], droneAt, rand(0.8, 1));
      droneAt += DRONE_GAPS[i] * rand(0.97, 1.03);
      droneStep++;
    }

    if (phraseAt < now - 1) phraseAt = now + 1;
    while (phraseAt < until && pending.length === 0) nextPhrase(phraseAt);
    while (pending.length && pending[0].time < until) {
      const note = pending.shift()!;
      if (note.time >= now - 0.02) playNote(note.semi, Math.max(now, note.time), note.velocity);
      if (!pending.length && phraseAt < until) nextPhrase(phraseAt);
    }
  }

  function setMood(next: Mood, at = ctx.currentTime) {
    if (next === mood) return;
    mood = next;
    // Let the phrase in progress go, then take a breath before the new mood starts.
    pending = pending.filter((n) => n.time < at + 0.4);
    phraseAt = Math.max(phraseAt, at + (next === 'cut' ? 3 : 2));
    tone.frequency.setTargetAtTime(TONE[next], at, next === 'cut' ? 0.5 : 1.5);
  }

  return {
    setMood,
    scheduleUntil,
    stop: () => {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      pending = [];
    },
  };
}
