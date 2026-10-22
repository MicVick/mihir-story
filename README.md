# The Kite

An interactive story told in one kite flight over Vadodara. A personal-story site for Mihir Gandhi, built from [SPEC.md](./SPEC.md).

## Run it

```sh
npm install
npm run dev         # http://localhost:5173
npm run build       # type-check and build to dist/
npm run check:copy  # fails if src/ contains an em or en dash
```

Add `?story` to the URL to open story mode directly. Story mode also loads on its own when WebGL is missing or the device is very low-end.

## Controls

| Input | Desktop | Mobile |
| --- | --- | --- |
| Climb | Mouse wheel, trackpad, Space, Arrow Up | Swipe up |
| Descend | Arrow Down, scroll up | Swipe down |

## Where things live

- `src/content/story.ts`: **all on-screen copy** and chapter data. Edit text here only. Lines marked `[CONFIRM]` are drafts.
- `src/content/palette.ts`: sky, kite and lantern colours.
- `src/state/store.ts`: the Zustand store shared by the UI and (later) the 3D scene. Choices are saved to localStorage when it is available.
- `src/state/compare.ts`: the "You flew n of 5" score and note.
- `src/content/beats.ts`: which card shows at which altitude. Each chapter's band is split evenly between its cards.
- `src/input/useFlightInput.ts`: wheel, touch and keys mapped to a target altitude (virtual scroll).
- `src/scene/`: the Three.js scene (sky shader, clouds, kite, string, camera rig).
- `src/ui/`: React components. `StoryMode.tsx` is the readable page.
- `public/photos/`: add WebP photos here and set `photo: '/photos/name.webp'` on a card in `story.ts`. Missing files hide cleanly.
- `public/audio/`: wind, crowd, creak, kaipoche and bells MP3s (Phase 5).

## Build phases

- [x] Phase 1: project, content and story mode
- [x] Phase 2: sky, kite and flight
- [ ] Phase 3: decisions and ending
- [ ] Phase 4: cuts, kites and lanterns
- [ ] Phase 5: opening, sound, photos and presenter mode
- [ ] Phase 6: QA and deploy
