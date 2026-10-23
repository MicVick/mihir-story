# The Kite

An interactive story told in one kite flight over Vadodara. A personal-story site for Mihir Gandhi, built from [SPEC.md](./SPEC.md).

Live at **https://mihir-story.vercel.app/**

## Run it

```sh
npm install
npm run dev         # http://localhost:5173
npm run build       # type-check and build to dist/
npm run preview     # serve the built site
npm run check:copy  # fails if src/ contains an em or en dash
```

URL options:

- `?story` opens story mode, the readable page. It also loads on its own when WebGL is missing or the device is very low-end.
- `?present` starts presenter mode.

## Controls

| Input | Desktop | Mobile |
| --- | --- | --- |
| Launch | Hold "Hold to launch" for 1 second (or press it once from the keyboard) | Press and hold |
| Climb | Mouse wheel, trackpad, Space, Arrow Up | Swipe up |
| Descend | Arrow Down, scroll up | Swipe down |
| Choose | Click a choice, or Tab then Enter | Tap a choice |
| Menu | Esc or the spool, top right | The spool |
| Presenter mode | P | From the menu |

The kite waits on the home terrace until it is launched. The climb locks at each of the five decisions until a choice is made. A choice cannot be changed; descending re-shows its reveal.

At 250 m a rival kite cuts the string (Cut 1); at 450 m the string goes slack (Cut 2). Both kites fall back to the home terrace, and the new kite climbs back on its own to the next chapter. "Re-tie the string" is held for one second, or pressed once from the keyboard.

**Presenter mode** climbs on its own at a steady pace, waits on each card long enough to read it aloud plus 2 seconds, and makes all text 15% larger. Decisions, the cut cards and the lanterns still wait for a click, so the room can vote.

**The spool menu** lists the chapters (reached ones can be revisited, the rest stay locked), and switches sound, presenter mode and story mode. The ring around the spool shows how much thread is out.

## Photos and sound

Both are optional and can be added at any time. Nothing is requested for a file that does not exist: the build lists both folders, so a missing photo or sound is simply skipped.

**Photos** go in `public/photos/`, as WebP, up to 1600 px wide and 200 KB each. Three cards have a slot ready in `src/content/story.ts`:

| File | Card |
| --- | --- |
| `terrace.webp` | Chapter 0, the terrace (childhood or family) |
| `building.webp` | Chapter 4, Nexus at NIT Surat (or the WictroniX team) |
| `iima.webp` | Chapter 9, IIM Ahmedabad |

To use a different photo or card, set `photo` and `photoAlt` on the card in `story.ts`. Photos show in a polaroid frame and load one chapter ahead of the kite.

**Sound** is off until the visitor turns it on ("Play with music" on the opening screen, the speaker icon, or the menu), and nothing loads before that.

**Music** is an original piece recorded from real instrument samples: piano arpeggios in D, a pentatonic melody that passes from piano to flute, and soft violins and cello underneath. It is rendered offline by `tools/music/render.py` (Python with numpy, and ffmpeg) into `public/audio/`:

| File | Plays |
| --- | --- |
| `music.mp3` | The main theme (2:07, loops). Soft on the terrace, full in flight |
| `music-cut.mp3` | The setback theme (B minor, slow piano and cello), in place of the main theme during a cut |
| `impact.mp3` | A low piano hit as the string snaps (softer for the slack cut) |
| `milestone.mp3` | A harp swell when a milestone number appears |
| `bells.mp3` | Three harp notes as each lantern rises |

In a cut, the main theme dips as the rival's string crosses, drops to silence at the snap, and the setback theme comes in after a breath; on relaunch the main theme returns. Everything loads only after sound is turned on (about 2.7 MB).

To change the music, edit `tools/music/render.py` and run `python3 -I tools/music/render.py <samples dir> public/audio`. The samples come from npm: `@audio-samples/piano-mp3-velocity4`, `-velocity7`, `-velocity10`, and `tonejs-instrument-flute-mp3`, `-violin-mp3`, `-cello-mp3`, `-harp-mp3` (unpack each into the samples dir, as the script's paths show).

**Credits.** Piano: [Salamander Grand Piano V3](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, CC BY 3.0. Flute, violin, cello and harp: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments), from public domain sources. The credit line also appears at the foot of the spool menu.

Optional extra files in `public/audio/`, royalty-free or self-recorded:

| File | Plays |
| --- | --- |
| `wind.mp3` | Looping wind, louder with altitude and in the gusts at decisions (synthesised until added) |
| `crowd.mp3` | Looping distant rooftop crowd, Chapter 0 only |
| `creak.mp3` | The string tightening at each decision (synthesised until added) |
| `kaipoche.mp3` | The "Kai po che!" shout at Cut 1 |

## The turns of the story

- **Chapter titles** rise over the sky as each chapter begins; after a cut the new kite's chapter is titled "A new kite".
- **Milestones** (`milestone` on a card or decision in `story.ts`) count up beside the kite with gold sparks and a harp swell: 99.64, 200%, ₹40 lakh, 280K, 99.51. In story mode they stand large between the cards.
- **Setbacks**: at the snap the screen flashes, the camera punches in, the fall runs in slow motion for a moment and the edges close in. The setback is then told full-screen on a dark veil, a sentence at a time. In story mode the cut chapters are dark bands.
- **Decisions**: the wind picks up and streaks cross the sky while a decision is open.
- **The journey rail** (desktop) runs down the left edge: every chapter at its altitude, the kite moving along it, with a diamond for each decision and a break for each cut once reached.

## Deploy (Vercel)

1. In Vercel, choose **Add New > Project** and import the `MicVick/mihir-story` repository.
2. Vercel detects Vite from `vercel.json`: build command `npm run build`, output `dist`. Keep the defaults and deploy.
3. Rename the project (for example `mihir-the-kite`) to get a clean `*.vercel.app` URL, or add a custom domain under **Settings > Domains**.
4. `index.html` already points `og:url`, `og:image` and the canonical link at https://mihir-story.vercel.app/. If the domain changes, update those three.

`vercel.json` caches hashed assets for a year and photos and sound for a week.

## Where things live

- `src/content/story.ts`: **all on-screen copy** and chapter data. Edit text here only. The wording here replaces the draft copy in SPEC.md.
- `src/content/palette.ts`: sky, kite and lantern colours, and each kite's pattern.
- `src/content/beats.ts`: which card shows at which altitude. Each chapter's band is split evenly between its cards.
- `src/state/store.ts`: the Zustand store shared by the UI and the 3D scene. Choices are saved to localStorage when it is available.
- `src/state/compare.ts`: the "You flew n of 5" score and note.
- `src/input/useFlightInput.ts`: wheel, touch and keys mapped to a target altitude (virtual scroll), plus Esc and P.
- `src/scene/`: the Three.js scene. `Rooftops.tsx` is the city and the home terrace, `haze.ts` the aerial perspective that fades everything into the sky, `cutTimeline.ts` the timings for both cuts.
- `src/audio/sound.ts`: the sound layers and the music cues. `tools/music/render.py`: renders the music.
- `src/ui/`: React components. `Moments.tsx` is the chapter titles and milestones, `CutSequence.tsx` the setbacks, `JourneyRail.tsx` the rail. `StoryMode.tsx` is the readable page, `SpoolMenu.tsx` the menu, `usePresenter.ts` presenter mode.
- `src/styles/`: `global.css` (tokens, cards, buttons), `components.css` (shared by both modes), `flight.css`, `story.css`.

## Build phases

- [x] Phase 1: project, content and story mode
- [x] Phase 2: sky, kite and flight
- [x] Phase 3: decisions and ending
- [x] Phase 4: cuts, kites and lanterns
- [x] Phase 5: opening, sound, photos and presenter mode
- [x] Phase 6: QA and deploy (live on Vercel; real-device testing on iPhone and Android still to do)
