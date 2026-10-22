// Layered sound, off by default. Nothing loads until the visitor turns it on.
// Each layer plays its file from public/audio when one exists (wind.mp3,
// crowd.mp3, creak.mp3, kaipoche.mp3, bells.mp3). Wind, creak and bells
// fall back to soft sounds made in the browser, so sound works before the
// files are added. The crowd and the "Kai po che!" shout need their files.

import files from 'virtual:audio';
import { useFlight } from '../state/store';

type Layer = 'wind' | 'crowd' | 'creak' | 'kaipoche' | 'bells';

const fileFor = (layer: Layer) => files.find((f) => f.replace(/\.[^.]+$/, '') === layer);

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  wind: { gain: GainNode; filter: BiquadFilterNode | null };
  crowd: GainNode | null;
  buffers: Partial<Record<Layer, AudioBuffer>>;
}

let engine: Engine | null = null;

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown noise: a soft rumble rather than a hiss.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  // Cross-fade the ends so the loop has no click.
  const fade = ctx.sampleRate * 0.25;
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[data.length - fade + i] = data[data.length - fade + i] * (1 - k) + data[i] * k;
  }
  return buffer;
}

async function loadFile(ctx: AudioContext, layer: Layer): Promise<AudioBuffer | undefined> {
  const name = fileFor(layer);
  if (!name) return undefined;
  try {
    const response = await fetch(`/audio/${name}`);
    return await ctx.decodeAudioData(await response.arrayBuffer());
  } catch {
    return undefined;
  }
}

function loop(ctx: AudioContext, buffer: AudioBuffer, destination: AudioNode) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(destination);
  source.start();
  return source;
}

/** Creates the audio graph inside the click that turned sound on, as browsers require. */
function start(): Engine {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  windGain.connect(master);
  const e: Engine = { ctx, master, wind: { gain: windGain, filter: null }, crowd: null, buffers: {} };

  // Synthesised wind until (or unless) the file arrives.
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.7;
  filter.frequency.value = 420;
  filter.connect(windGain);
  const synthWind = loop(ctx, noiseBuffer(ctx, 6), filter);
  e.wind.filter = filter;

  void loadFile(ctx, 'wind').then((buffer) => {
    if (!buffer) return;
    synthWind.stop();
    filter.disconnect();
    e.wind.filter = null;
    loop(ctx, buffer, windGain);
  });
  void loadFile(ctx, 'crowd').then((buffer) => {
    if (!buffer) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    loop(ctx, buffer, gain);
    e.crowd = gain;
  });
  for (const layer of ['creak', 'kaipoche', 'bells'] as const) {
    void loadFile(ctx, layer).then((buffer) => {
      if (buffer) e.buffers[layer] = buffer;
    });
  }
  return e;
}

/** Turns sound on or off. Call from a click or key press. */
export function setSoundOn(on: boolean) {
  useFlight.getState().setSound(on);
  if (on) {
    engine ??= start();
    void engine.ctx.resume();
    engine.master.gain.setTargetAtTime(0.8, engine.ctx.currentTime, 0.3);
  } else if (engine) {
    engine.master.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.15);
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Called every frame: wind rises with altitude and gusts at decisions; the crowd fades as the kite leaves the rooftops. */
export function updateSound(altitude: number, gust: number) {
  if (!engine || !useFlight.getState().sound) return;
  const { ctx, wind, crowd } = engine;
  const t = ctx.currentTime;
  const level = 0.12 + 0.22 * smooth(0, 900, altitude) + 0.18 * gust;
  wind.gain.gain.setTargetAtTime(level, t, 0.4);
  if (wind.filter) {
    const sway = Math.sin(t * 0.37) * 60 + Math.sin(t * 0.13) * 90;
    wind.filter.frequency.setTargetAtTime(380 + 420 * smooth(0, 900, altitude) + 250 * gust + sway, t, 0.5);
  }
  crowd?.gain.setTargetAtTime(0.5 * (1 - smooth(0, 120, altitude)), t, 0.6);
}

function playBuffer(buffer: AudioBuffer, volume: number, when = 0) {
  if (!engine) return;
  const { ctx, master } = engine;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain).connect(master);
  source.start(ctx.currentTime + when);
}

/** The string tightening as the wind shifts at a decision. */
export function playCreak() {
  if (!engine || !useFlight.getState().sound) return;
  if (engine.buffers.creak) return playBuffer(engine.buffers.creak, 0.6);
  const { ctx, master } = engine;
  // Three short, uneven strains through a narrow filter.
  [0, 0.17, 0.41].forEach((delay, i) => {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70 + i * 11, t);
    osc.frequency.linearRampToValueAtTime(95 + i * 9, t + 0.14);
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 9;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(filter).connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** "Kai po che!" when the rival's string crosses. Needs kaipoche.mp3. */
export function playShout() {
  if (!engine || !useFlight.getState().sound || !engine.buffers.kaipoche) return;
  playBuffer(engine.buffers.kaipoche, 0.9);
}

/** The string parting: a short bright snap. */
export function playSnap() {
  if (!engine || !useFlight.getState().sound) return;
  const { ctx, master } = engine;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.09);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.16);
}

// One note of a pentatonic scale for each lantern.
const BELL_NOTES = [659.25, 783.99, 987.77];

/** A soft bell as a lantern is released. */
export function playBell(index: number) {
  if (!engine || !useFlight.getState().sound) return;
  if (engine.buffers.bells) return playBuffer(engine.buffers.bells, 0.6);
  const { ctx, master } = engine;
  const t = ctx.currentTime;
  const f = BELL_NOTES[index % BELL_NOTES.length];
  // Inharmonic partials of a small bell, the higher ones fading first.
  [
    [1, 0.16, 3.2],
    [2.76, 0.06, 1.6],
    [5.4, 0.035, 0.9],
    [8.93, 0.018, 0.5],
  ].forEach(([ratio, volume, decay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = f * ratio;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  });
}

/** Silence while the tab is hidden; carry on when it returns. */
export function pauseSound(paused: boolean) {
  if (!engine) return;
  if (paused) void engine.ctx.suspend();
  else if (useFlight.getState().sound) void engine.ctx.resume();
}
