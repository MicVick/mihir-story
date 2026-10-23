"""Renders the site's music from real instrument samples.

Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0).
Flute, violin, cello, harp: tonejs-instruments (public domain sources).

Usage: python3 -I render.py <samples dir> <out dir>
"""
import os
import subprocess
import sys

import numpy as np

SR = 44100
SAMPLES, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)

NOTE = {'C': 0, 'C#': 1, 'Cs': 1, 'D': 2, 'D#': 3, 'Ds': 3, 'E': 4, 'F': 5, 'F#': 6, 'Fs': 6,
        'G': 7, 'G#': 8, 'Gs': 8, 'A': 9, 'A#': 10, 'As': 10, 'B': 11}


def midi(name):
    """'F#4' -> 66."""
    pitch, octave = name[:-1], int(name[-1])
    return 12 * (octave + 1) + NOTE[pitch]


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


class Instrument:
    def __init__(self, folder, pattern=None, trim=1.0):
        # trim brings each sample set to the piano's level (measured RMS over the first second).
        self.notes = {}
        for f in os.listdir(folder):
            if not f.endswith('.mp3') or ' ' in f:
                continue
            stem = f[:-4]
            if pattern:
                stem = stem.split('v')[0]
            try:
                self.notes[midi(stem)] = decode(os.path.join(folder, f)) * trim
            except (KeyError, ValueError):
                pass
        self.keys = np.array(sorted(self.notes))

    def sample(self, note):
        nearest = int(self.keys[np.argmin(np.abs(self.keys - note))])
        data = self.notes[nearest]
        ratio = 2 ** ((note - nearest) / 12)
        if abs(ratio - 1) < 1e-6:
            return data
        n = int(len(data) / ratio)
        x = np.arange(n) * ratio
        return np.stack([np.interp(x, np.arange(len(data)), data[:, c]) for c in range(2)], axis=1)


def piano_dir(v):
    return os.path.join(SAMPLES, f'_audio-samples_piano-mp3-velocity{v}', 'package', 'audio')


def tone_dir(name):
    return os.path.join(SAMPLES, f'tonejs-instrument-{name}-mp3', 'package')


print('loading samples...')
PIANO = {v: Instrument(piano_dir(v), pattern='v') for v in (4, 7, 10)}
FLUTE = Instrument(tone_dir('flute'), trim=0.093)
VIOLIN = Instrument(tone_dir('violin'), trim=0.18)
CELLO = Instrument(tone_dir('cello'), trim=0.11)
HARP = Instrument(tone_dir('harp'), trim=0.2)


class Track:
    def __init__(self, seconds):
        self.buf = np.zeros((int(seconds * SR), 2), dtype=np.float64)

    def add(self, data, start, gain=1.0, length=None, attack=0.0, release=0.4, pan=0.0):
        """Mixes `data` in at `start` seconds, cut to `length` seconds with a release fade."""
        data = data.copy()
        if length is not None:
            end = int((length + release) * SR)
            data = data[:end]
            fade_from = int(length * SR)
            if fade_from < len(data):
                k = np.linspace(1, 0, len(data) - fade_from) ** 2
                data[fade_from:] *= k[:, None]
        if attack > 0:
            a = min(len(data), int(attack * SR))
            data[:a] *= (np.sin(np.linspace(0, np.pi / 2, a)) ** 2)[:, None]
        if pan:
            data[:, 0] *= np.sqrt((1 - pan) / 2) * np.sqrt(2)
            data[:, 1] *= np.sqrt((1 + pan) / 2) * np.sqrt(2)
        i = int(start * SR)
        if i < 0:
            data, i = data[-i:], 0
        j = min(len(self.buf), i + len(data))
        if j > i:
            self.buf[i:j] += gain * data[: j - i]


def piano(track, note, start, length, vel=7, gain=1.0):
    layer = 4 if vel <= 5 else 7 if vel <= 8 else 10
    jitter = rng.normal(0, 0.006)
    track.add(PIANO[layer].sample(note), start + jitter, gain * rng.uniform(0.92, 1.05), length=length, release=0.9)


def reverb(buf, seconds=3.2, wet=0.3, predelay=0.02):
    """Convolution with a synthetic hall: decorrelated noise, darker as it decays."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n + int(predelay * SR), 2))
    for c in range(2):
        noise = rng.normal(0, 1, n)
        # Darken over time: blend a smoothed copy in as the tail goes on.
        smooth = np.convolve(noise, np.ones(12) / 12, mode='same')
        mix = np.clip(t / seconds * 1.8, 0, 1)
        tail = (noise * (1 - mix) + smooth * 2.2 * mix) * np.exp(-6.9 * t / seconds)
        ir[int(predelay * SR):, c] = tail
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    out = np.zeros((len(buf) + len(ir) - 1, 2))
    size = 1 << int(np.ceil(np.log2(len(out))))
    for c in range(2):
        out[:, c] = np.fft.irfft(np.fft.rfft(buf[:, c], size) * np.fft.rfft(ir[:, c], size), size)[: len(out)]
    dry = np.zeros_like(out)
    dry[: len(buf)] = buf
    return dry * (1 - wet * 0.5) + out * wet


def finish(buf, loop_seconds=None, peak=0.89):
    """Folds the reverb tail onto the start for a seamless loop, then normalises."""
    if loop_seconds:
        n = int(loop_seconds * SR)
        tail = buf[n:]
        buf = buf[:n].copy()
        buf[: len(tail)] += tail[: n]
    buf = buf / np.max(np.abs(buf)) * peak
    return buf


def write(buf, name, bitrate='128k', mono=False):
    pcm = (np.clip(buf, -1, 1) * 32767).astype('<i2').tobytes()
    path = os.path.join(OUT, name)
    args = ['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-']
    if mono:
        args += ['-ac', '1']
    subprocess.run(args + ['-codec:a', 'libmp3lame', '-b:a', bitrate, path], input=pcm, check=True)
    print(f'{name}: {len(buf) / SR:.1f} s, {os.path.getsize(path) / 1024:.0f} KB')


m = midi

# ---------------------------------------------------------------- main theme
# D major, 64 bpm. Piano arpeggios carry it; the melody keeps to the D major
# pentatonic (D E F# A B), which gives it a gentle, open, Indian colour.
BPM = 64
BEAT = 60 / BPM
BAR = 4 * BEAT

# (bass, [arpeggio notes]) per chord.
CHORDS = {
    'D': (m('D2'), [m('A2'), m('D3'), m('E3'), m('F#3')]),
    'A/C#': (m('C#2'), [m('A2'), m('E3'), m('A3'), m('B3')]),
    'Bm7': (m('B1'), [m('F#2'), m('B2'), m('D3'), m('A3')]),
    'G': (m('G1'), [m('G2'), m('D3'), m('A3'), m('B3')]),
    'Em7': (m('E2'), [m('B2'), m('D3'), m('G3'), m('B3')]),
    'G2': (m('G2'), [m('D3'), m('G3'), m('A3'), m('B3')]),
    'D/F#': (m('F#2'), [m('A2'), m('D3'), m('F#3'), m('A3')]),
    'Asus': (m('A1'), [m('E2'), m('A2'), m('D3'), m('E3')]),
    'A': (m('A1'), [m('E2'), m('A2'), m('C#3'), m('E3')]),
    'Bm': (m('B1'), [m('F#2'), m('B2'), m('D3'), m('F#3')]),
}
# Violin pad voicings (three soft notes) per chord.
PAD = {
    'D': ['A3', 'D4', 'F#4'], 'A/C#': ['A3', 'C#4', 'E4'], 'Bm7': ['A3', 'D4', 'F#4'], 'G': ['G3', 'B3', 'D4'],
    'Em7': ['G3', 'B3', 'E4'], 'G2': ['G3', 'B3', 'D4'], 'D/F#': ['A3', 'D4', 'F#4'], 'Asus': ['A3', 'D4', 'E4'],
    'A': ['A3', 'C#4', 'E4'], 'Bm': ['B3', 'D4', 'F#4'],
}

A_CHORDS = ['D', 'A/C#', 'Bm7', 'G'] * 2
B_CHORDS = ['Em7', 'G2', 'D/F#', 'Asus', 'Bm', 'G2', 'D', 'Asus']

# Melody, as (note, beats) per bar. 'r' is a rest.
A_MELODY = [
    [('F#5', 2), ('E5', 1), ('D5', 1)],
    [('E5', 1.5), ('F#5', 0.5), ('A5', 2)],
    [('B5', 1), ('A5', 1), ('F#5', 1), ('E5', 1)],
    [('D5', 2), ('B4', 1), ('D5', 1)],
    [('F#5', 2), ('A5', 1), ('B5', 1)],
    [('A5', 2), ('E5', 1), ('F#5', 1)],
    [('D5', 1.5), ('E5', 0.5), ('F#5', 1), ('B4', 1)],
    [('D5', 3), ('r', 1)],
]
B_MELODY = [
    [('G5', 1.5), ('F#5', 0.5), ('E5', 2)],
    [('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1)],
    [('F#5', 3), ('E5', 1)],
    [('E5', 4)],
    [('B5', 1.5), ('A5', 0.5), ('F#5', 2)],
    [('G5', 1), ('F#5', 1), ('E5', 1), ('D5', 1)],
    [('F#5', 2), ('A5', 2)],
    [('A5', 2), ('F#5', 1), ('E5', 1)],
]
ARP = [None, 0, 1, 2, 3, 2, 1, 0]  # None is the bass note.


def arpeggio(track, chord, start, vel=4, gain=0.45, sparse=False):
    bass, notes = CHORDS[chord]
    for i, idx in enumerate(ARP):
        if sparse and i % 2:
            continue
        t = start + i * BEAT / 2
        ring = BAR - i * BEAT / 2 + 0.25  # Pedal: everything rings to the end of the bar.
        if idx is None:
            piano(track, bass, t, ring, vel=vel + 2, gain=gain * 1.1)
        else:
            piano(track, notes[idx], t, ring, vel=vel, gain=gain * (0.85 if i % 2 else 0.95))


def melody(track, bars, start, instrument='piano', vel=7, gain=1.1, octave=0):
    t = start
    for bar in bars:
        for name, beats in bar:
            length = beats * BEAT
            if name != 'r':
                note = m(name) + 12 * octave
                if instrument == 'piano':
                    piano(track, note, t, length * 1.25, vel=vel, gain=gain)
                else:
                    track.add(FLUTE.sample(note), t + 0.02, gain * rng.uniform(0.94, 1.03), length=length * 1.02,
                              attack=0.07, release=0.45, pan=0.12)
            t += length


def pad(track, chords, start, gain=0.35):
    for i, chord in enumerate(chords):
        t = start + i * BAR
        for k, name in enumerate(PAD[chord]):
            for cents, delay, pan in ((-7, 0.0, -0.35), (6, 0.04, 0.35)):
                data = VIOLIN.sample(m(name) + cents / 100)
                track.add(data, t + delay - 0.3, gain, length=BAR + 0.2, attack=1.4, release=1.6, pan=pan)


def cello(track, chords, start, gain=0.6):
    for i, chord in enumerate(chords):
        bass = CHORDS[chord][0]
        while bass < m('C2'):
            bass += 12
        track.add(CELLO.sample(bass), start + i * BAR, gain, length=BAR * 0.95, attack=0.35, release=1.2)


def harp_gliss(track, start, notes, gap=0.07, gain=0.8):
    for i, name in enumerate(notes):
        track.add(HARP.sample(m(name)), start + i * gap, gain * (0.7 + 0.3 * i / len(notes)), length=4, release=1.5,
                  pan=-0.4 + 0.8 * i / len(notes))


def main_theme():
    # Intro (2 bars) | A1 piano | A2 flute + pad | B strings | A3 piano, thinning out.
    bars = 2 + 8 + 8 + 8 + 8
    length = bars * BAR
    tr = Track(length + 8)
    t = 0.0
    # Intro: the arpeggio alone.
    for i, c in enumerate(['D', 'A/C#']):
        arpeggio(tr, c, t + i * BAR, vel=4, gain=0.42)
    t += 2 * BAR
    # A1: piano melody.
    for i, c in enumerate(A_CHORDS):
        arpeggio(tr, c, t + i * BAR)
    melody(tr, A_MELODY, t, vel=7, gain=1.1)
    t += 8 * BAR
    # A2: the flute takes the tune, violins enter softly.
    harp_gliss(tr, t - 0.6, ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5'])
    for i, c in enumerate(A_CHORDS):
        arpeggio(tr, c, t + i * BAR, gain=0.4)
    melody(tr, A_MELODY, t, instrument='flute', gain=0.9)
    pad(tr, A_CHORDS, t, gain=0.22)
    t += 8 * BAR
    # B: strings carry it, piano and flute share the tune.
    for i, c in enumerate(B_CHORDS):
        arpeggio(tr, c, t + i * BAR, gain=0.4)
    pad(tr, B_CHORDS, t, gain=0.32)
    cello(tr, B_CHORDS, t, gain=0.55)
    melody(tr, B_MELODY[:4], t, vel=7, gain=1.1)
    melody(tr, B_MELODY[4:], t + 4 * BAR, instrument='flute', gain=0.9)
    t += 8 * BAR
    # A3: piano alone again, the melody half-remembered, then back to the start.
    for i, c in enumerate(A_CHORDS):
        arpeggio(tr, c, t + i * BAR, gain=0.42, sparse=i >= 6)
    melody(tr, A_MELODY[:4], t, vel=4, gain=1.3)
    melody(tr, [[('F#5', 4)], [('E5', 4)], [('D5', 4)], [('r', 4)]], t + 4 * BAR, vel=4, gain=1.0)
    buf = reverb(tr.buf, seconds=3.4, wet=0.42)
    return finish(buf, loop_seconds=length)


# ---------------------------------------------------------------- setback theme
# B minor, slower, sparse: low piano, a cello line, long silences.
def setback_theme():
    beat = 60 / 52
    bar = 4 * beat
    chords = [('B1', ['F#2', 'B2', 'D3']), ('G1', ['D2', 'G2', 'B2']), ('E2', ['B2', 'E3', 'G3']), ('F#1', ['C#2', 'F#2', 'A#2'])]
    tune = [[('F#4', 3), ('E4', 1)], [('D4', 4)], [('E4', 2), ('G4', 2)], [('F#4', 4)]]
    bars = 8
    length = bars * bar
    tr = Track(length + 8)
    for i in range(bars):
        bass, notes = chords[i % 4]
        t = i * bar
        piano(tr, m(bass), t, bar + 0.3, vel=5, gain=0.7)
        for k, n in enumerate(notes):
            piano(tr, m(n), t + beat * (1 + k * 0.5), bar - beat + 0.3, vel=4, gain=0.42)
        if i >= 4:
            track_bass = m(bass) + 12 if m(bass) < m('C2') else m(bass)
            tr.add(CELLO.sample(track_bass), t, 0.6, length=bar * 0.95, attack=0.6, release=1.5)
    t = 4 * bar
    for bar_notes in tune:
        for name, beats in bar_notes:
            piano(tr, m(name), t, beats * beat * 1.3, vel=4, gain=0.6)
            t += beats * beat
    buf = reverb(tr.buf, seconds=4.2, wet=0.5)
    return finish(buf, loop_seconds=length)


def impact():
    """The string snaps: a low piano cluster, struck hard, and a cello underneath."""
    tr = Track(7)
    for name in ('A0', 'D1', 'A1', 'D2'):
        piano(tr, m(name), 0, 5, vel=10, gain=0.5)
    tr.add(CELLO.sample(m('D2')), 0.05, 0.8, length=3.5, attack=0.02, release=2)
    return finish(reverb(tr.buf, seconds=4, wet=0.5)[: 7 * SR], peak=0.95)


def milestone():
    """A milestone: a harp sweep up the pentatonic, landing on a soft high piano chord."""
    tr = Track(6)
    harp_gliss(tr, 0, ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6'], gap=0.075, gain=1.0)
    for name in ('D5', 'F#5', 'A5', 'D6'):
        piano(tr, m(name), 0.85, 3.5, vel=7, gain=0.45)
    return finish(reverb(tr.buf, seconds=3.4, wet=0.45)[: 6 * SR], peak=0.8)


def bells():
    """A lantern rises: three soft harp notes."""
    tr = Track(5)
    for i, name in enumerate(('A5', 'D6', 'F#6')):
        tr.add(HARP.sample(m(name)), i * 0.16, 1.0, length=3, release=1.2, pan=-0.2 + 0.2 * i)
    return finish(reverb(tr.buf, seconds=3, wet=0.45)[: 5 * SR], peak=0.7)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[3:])
    jobs = [('music.mp3', main_theme, '128k'), ('music-cut.mp3', setback_theme, '96k'),
            ('impact.mp3', impact, '96k'), ('milestone.mp3', milestone, '96k'), ('bells.mp3', bells, '96k')]
    for name, fn, rate in jobs:
        if only and name not in only:
            continue
        write(fn(), name, rate)
