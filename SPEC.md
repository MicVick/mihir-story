# The Kite: Website Build Spec

Oct 22, 2026 · @Mihir

## 1. Overview

Build a single-page, interactive personal-story website for Mihir Gandhi, set in the sky over Vadodara on Uttarayan. The visitor flies a kite. As it climbs, Mihir's story unfolds. At five heights the wind shifts and the visitor must make a decision Mihir actually faced. Twice, the kite is cut.

- **Course:** Strategic (Personal) Storytelling, IIM Ahmedabad. Major assignment, individual.
- **Audience:** the professor and classmates first (often on a projector), then peers and recruiters on phones and laptops.
- **Core rule:** the kite is the world, the decisions are the wind. Decisions move the kite; they are not a separate quiz.
- **Length:** about 6 to 8 minutes for the full flight. A "Read the story" mode gives the same content as a normal page in about 2 minutes.
- **What the visitor should leave with:** Mihir picks the harder, unknown path, holds on to his values, and builds again after every fall.

**How to use this spec with Claude Code**

1. Export this doc as Markdown and save it in the project root as `SPEC.md`.
2. First prompt: "Read SPEC.md fully. Build Phase 1 only, then stop and tell me what you built."
3. Continue one phase at a time (Section 9). Review each phase in the browser before moving on.
4. All on-screen text lives in one content file (Section 7). Components never hardcode copy.
5. Copy rules: simple, professional language; no em dashes anywhere; numbers exactly as written in Section 3.
6. Lines marked **\[CONFIRM\]** are drafts Mihir will check before launch. Build them as written.

## 2. Story structure

The flight runs through 11 chapters from dawn to night: five decisions, two cut kites, and one story beat that is told but not chosen (the AstroLive codebase call). Altitude is decorative and shown on the spool meter; story order is what matters.

| # | Chapter | Mihir's age / period | Sky | Altitude (m) | Type |
| --- | --- | --- | --- | --- | --- |
| 0 | The terrace | Childhood, Vadodara | Dawn | 0 | Intro and launch |
| 1 | Leaving home | 16 (2018) | Early morning | 100 | Decision 1: stay home or go to Kota |
| 2 | The branch | 18 (2020) | Morning | 200 | Decision 2: IIT Civil/Mechanical or NIT Surat CSE |
| 3 | The cut | 19 | Overcast | 250, falls to 60 | Cut kite 1: losing his father |
| 4 | Building | NIT Surat years | Noon | 300 | Story: Nexus, E-Cell, WictroniX begins |
| 5 | The offer | WictroniX years | Early afternoon | 400 | Decision 3: the RTO data project |
| 6 | The stall | 2024, graduation | Hazy afternoon | 450, falls to 300 | Cut kite 2, then Decision 4: continue WictroniX or do something else |
| 7 | Chingari | 2024 to 2025 | Late afternoon | 550 | Story: AstroLive and the codebase call |
| 8 | The leap | 22 (2024) | Golden hour | 650 | Decision 5: stay a PM or go for an MBA |
| 9 | IIM Ahmedabad | 2025 to today | Sunset | 750 | Highlights and life beyond work |
| 10 | Lanterns | The future | Night | 850 | Goals, choice comparison, contact |

**Kite changes with life stage.** Kite 1 (magenta and yellow) flies chapters 0 to 3. After the first cut, the visitor relaunches Kite 2 (saffron and white) for chapters 3 to 6. After Decision 4, Kite 3 (teal and white) flies from Chingari to the end. The kite change is the visual sign that Mihir started over.

## 3. On-screen copy

All copy below is final unless marked **\[CONFIRM\]**. Voice: decision prompts speak to the visitor as "you"; everything else is Mihir in first person. Each card holds at most 60 words.

### Chapter 0: The terrace

- **Loader:** Tying the string...
- **Hero title:** Mihir Gandhi
- **Hero subtitle:** One flight. Five decisions. Two cut kites.
- **Small Gujarati word above the title:** ઉત્તરાયણ (Uttarayan)
- **Card:** Every January, Vadodara moves to its rooftops. This is where I grew up, studying at Bright School and spending Uttarayan on the terrace with my family. My father ran a small business in the city.
- **Stat line:** Class X: 92.5%, top 0.36% in the state.
- **Button:** Hold to launch
- **Secondary link:** Read the story instead
- **Hint after launch:** Scroll or swipe up to fly higher.

### Chapter 1: Leaving home (Decision 1)

- **Wind label:** The wind shifts.
- **Prompt:** You are 16. Your teachers know you well and have promised to take the best care of you if you stay. Or you can move alone to Kota, where you know no one and everything is unknown.
- **Option A:** Stay home | Familiar teachers, family, comfort.
- **Option B:** Go to Kota | A new city, on your own.
- **Mihir's choice:** B
- **Reveal:** I chose Kota. Staying was the comfortable option, and I wanted to find out how far I could go without it. **\[CONFIRM\]**
- **Result line:** Class XII: 95.8%, rank 5 of 171. KVPY Fellowship, All India Rank 191. JEE Mains: 99.64 percentile.

### Chapter 2: The branch (Decision 2)

- **Prompt:** Your rank opens two doors. Civil or Mechanical Engineering at IIT Delhi or IIT Bombay. Or Computer Science at NIT Surat.
- **Option A:** IIT, Civil or Mechanical | A top IIT on your degree.
- **Option B:** NIT Surat, Computer Science | The branch you want to study.
- **Mihir's choice:** B
- **Reveal:** I chose Computer Science at NIT Surat. I wanted to build with technology, and the subject mattered more to me than the name on the gate. **\[CONFIRM\]**

### Chapter 3: The cut (Cut kite 1)

- **Rival shout (on screen and audio):** Kai po che!
- **Card 1:** At 19, I lost my father to COVID-19. Restrictions meant our relatives could not come to help. Overnight, I was managing the family's finances, taxes and my father's business, and looking after my mother and two younger brothers, while still in college.
- **Card 2:** It taught me to stay calm under pressure and to be grateful for what I have. It also gave me a reason. I had seen what the pandemic did to small businesses like his.
- **Button:** Re-tie the string

### Chapter 4: Building

- **Card 1 (Nexus):** After COVID, campus came back without its culture. Seniors and juniors barely met. With a few classmates, I convinced the HoD and professors to start Nexus, the Computer Science department's official club: hackathons, seminars, sports and cultural events. Engagement grew 200% in a year.
- **Card 2 (WictroniX):** In 2022, I co-founded WictroniX to help small businesses adopt technology and digital tools. It became a DPIIT-recognised startup with 50 clients across 8 industries and 3 countries, and ₹40 lakh in revenue.
- **Card 3 (small chips around the kite):** E-Cell Convenor, NIT Surat: 9 events, 2,000+ students | AI-LMS piloted with 800+ students at MS University, ₹4 lakh government grant

### Chapter 5: The offer (Decision 3)

- **Prompt:** A client offers WictroniX a large payout to build software that cleans and searches personal data from RTO records. Then you learn the data was obtained unethically. Half your team wants to take it.
- **Option A:** Take the project | A big payout. You only write the code.
- **Option B:** Walk away | Turn down the money.
- **Mihir's choice:** B
- **Reveal:** I argued to walk away, and after long debates the team agreed. Integrity comes before profit, especially when no one else would know.

### Chapter 6: The stall (Cut kite 2 and Decision 4)

- **Card:** By 2024, WictroniX had stopped growing. I had misjudged demand in some segments, struggled to keep clients for the long term, and had not built a team structure that could scale. Passion and effort had taken us far, but not far enough.
- **Prompt:** Graduation is weeks away and your kite has fallen. Re-tie the same one, or pick up a new kite?
- **Option A:** Keep building WictroniX | Fix it from the inside.
- **Option B:** Do something else | Step away and start fresh.
- **Mihir's choice:** B
- **Reveal:** I stepped away and joined Chingari, a Series A startup, as an Associate Product Manager. I wanted to learn how a funded company builds and scales products, the exact part I had struggled with. **\[CONFIRM\]**

### Chapter 7: Chingari

- **Card 1:** At Chingari, I co-led AstroLive, an astrology livestreaming product, from zero. Leadership wanted to reuse the Chingari codebase to launch faster. I believed the two business models were too different, so the Engineering Manager and I built a feature-level demo to show why. We built AstroLive from scratch.
- **Card 2:** AstroLive grew to 280K monthly active users and 62% month-on-month revenue growth, with a 24-member cross-functional team. I also integrated a UPI gateway that now processes ₹2 crore+ every month.

### Chapter 8: The leap (Decision 5)

- **Prompt:** You are 22 and leading a product that grows every month. You could stay and grow as a product manager. Or you could leave for two years of business school.
- **Option A:** Stay a product manager | Keep the momentum.
- **Option B:** Go for an MBA | Two years away from building.
- **Mihir's choice:** B
- **Reveal:** WictroniX had shown me my gaps in strategy, finance and scale, and I wanted to close them before building again. I scored 99.51 percentile in CAT 2024 and joined IIM Ahmedabad as a Praxis Scholar.

### Chapter 9: IIM Ahmedabad

- **Card title:** IIM Ahmedabad, 2025 to today
- **Chips (small kites flying beside his):**
  - Amazon: Program Manager Intern. Built an ML tool that explains about 85% of what moves GMS in vendor discussions.
  - Picus Capital: Student Venture Partner, scouting early-stage startups.
  - EntreVC: Club Coordinator. Hosted a fireside chat with Sarvam AI's founding engineer.
  - CultComm: 1 of 22 selected from 160+ applicants.
- **Card (beyond work):** Off the terrace, I travel, often to spiritual places like Palitana, Varanasi and Shravanabelagola. I read non-fiction, play chess and table tennis, and my writing on Quora has 100K+ views.

### Chapter 10: Lanterns

- **Intro line:** Night falls. Every terrace lights a lantern.
- **Instruction:** Tap a lantern to release it.
- **Lantern 1:** Return to entrepreneurship. **\[CONFIRM\]**
- **Lantern 2:** Build technology that makes small businesses resilient. **\[CONFIRM\]**
- **Lantern 3:** Solve problems at India's scale, with economic and social impact. **\[CONFIRM\]**
- **Comparison heading:** You flew {n} of 5 the way I did.
- **Comparison note by score:** 5 of 5: We would share a terrace. | 3 or 4: Close. We just read the wind differently. | 0 to 2: You would fly a different kite. I would like to hear why.
- **Comparison rows:** one row per decision: decision name, your choice, my choice.
- **Closing line:** Most kites get cut eventually. What matters is whether you go back to the terrace.
- **Buttons:** Fly again | Read the story | Email me | LinkedIn

## 4. Interaction design

The visitor controls one thing: how high the kite flies. Everything else (cards, decisions, cuts) is triggered by altitude, and the climb pauses until the visitor responds.

### Controls

| Input | Desktop | Mobile | Effect |
| --- | --- | --- | --- |
| Climb | Mouse wheel, trackpad, Space, Arrow Up | Swipe up | Pull the string; altitude rises |
| Descend | Arrow Down, scroll up | Swipe down | Revisit earlier cards (cannot undo a decision) |
| Choose | Click a choice card, or Tab then Enter | Tap a choice card | Records the choice |
| Hold actions | Press and hold button 1 second | Press and hold | Launch, re-tie string |
| Menu | Esc or spool icon | Spool icon | Opens chapter list, sound toggle, story mode |

Use a virtual scroll (wheel and touch deltas mapped to an altitude value), not native page scroll, so the climb can be locked at decisions. Smooth the value with damping so the kite never jumps.

### Flow states

| State | What happens | Exits to |
| --- | --- | --- |
| `intro` | Rooftop at dawn, hero title, "Hold to launch" | `flying` after hold completes |
| `flying` | Altitude follows input; story cards fade in and out at their altitudes | `deciding`, `cut`, `ending` when a trigger altitude is reached |
| `deciding` | Climb locks. A gust sways the kite and bends the string. Two choice cards appear | `revealing` after a choice |
| `revealing` | Kite drifts briefly toward the chosen side, then the wind recentres it on Mihir's real path. Reveal card shows two badges: "You chose: X" and "I chose: Y" | flying on "Continue", or next climb input after 1.5 s |
| `cut` | Rival kite crosses the string, "Kai po che!", string snaps, kite tumbles with camera following, sky desaturates. Cut cards appear | `relaunch` |
| `relaunch` | "Re-tie the string" hold button. New kite rises from the rooftops; colour returns to the sky over 2 s | `flying` |
| `ending` | Night. Lanterns rise; visitor taps 3 hero lanterns to release goals. Then comparison panel and contact buttons | `intro` on "Fly again" |

### Decision rules

- Both options are always equal in size, colour and position weight. Never hint at Mihir's answer before the reveal.
- Option order is fixed as written in Section 3, so the comparison is fair.
- A decision cannot be changed after the reveal. Descending only re-shows the reveal card.
- Store choices in memory. Optionally save to localStorage (wrapped in try/catch) so a reload resumes the flight; the site must work fully without it.

### The two cuts

- **Cut 1 (Chapter 3):** automatic. No choice. A rival kite enters from the left over 1.5 s, strings cross, a short shake (disabled under reduced motion), then the kite falls toward the rooftops. Two cards, then "Re-tie the string". Kite 2 launches.
- **Cut 2 (Chapter 6):** the string goes slack and the kite drifts down slowly, no rival kite. The stall card appears, then Decision 4 is shown as two kites on the rooftop: the old Kite 2 with a patch, and a new teal Kite 3. Whatever the visitor picks, the reveal shows Mihir picked the new kite, and Kite 3 launches.

### Story cards

- Desktop: cards sit in a column to the right of the kite, max width 420 px, vertically centred.
- Mobile: cards are a bottom sheet, max 45% of screen height, the kite stays visible in the top half.
- A card appears when the kite enters its altitude band and fades out when the kite leaves it. Cards with photos show the photo in a white polaroid frame above the text.
- Chips in Chapters 4 and 9 are small labelled kites flying beside Mihir's kite; tapping a chip expands it into a card.

### Progress: the spool (firki)

- Top-right icon shaped like a kite spool. The thread wound on it shrinks as the flight progresses.
- Opening it shows the chapter list. Visited chapters can be jumped to; unvisited ones are locked until reached.

### Presenter mode

- Press P (or add `?present` to the URL) to auto-climb at a steady pace for class presentations. Decisions still wait for a click, which lets the presenter ask the audience to vote.
- Cards stay on screen 2 s longer in this mode. Text size increases 15%.

### Sound

- Off by default; toggle in the menu and a small speaker icon.
- Layers: wind (volume rises with altitude), distant rooftop crowd in Chapter 0, string tension creak at decisions, "Kai po che!" shout at Cut 1, soft bells at the lanterns.
- Use only royalty-free or self-recorded audio. Total audio under 1.5 MB, loaded after the first interaction.

## 5. Visual design system

The look is warm, hand-made and Gujarati: soft gradient skies, flat-coloured paper kites, and clean modern type on frosted cards. No glossy 3D, no neon, no stock icons.

### Sky palette by chapter

The sky is a vertical gradient. Colours blend smoothly as altitude moves between chapters.

| Sky | Chapters | Top colour | Horizon colour | Card style |
| --- | --- | --- | --- | --- |
| Dawn | 0 | #F4B8A0 | #FCE6D2 | Light |
| Early morning | 1 | #9CCBE8 | #F6E7D3 | Light |
| Morning | 2 | #6FB3E4 | #DCEFFA | Light |
| Overcast | 3 | #7F8A96 | #C7CCD2 | Light |
| Noon | 4 | #3F97DB | #CFE7F7 | Light |
| Early afternoon | 5 | #3A8BD0 | #E6EEDB | Light |
| Hazy afternoon | 6 | #8FA5B8 | #E8DCC4 | Light |
| Late afternoon | 7 | #3F7FC2 | #F3D9A4 | Light |
| Golden hour | 8 | #E39A4E | #F8D78E | Light |
| Sunset | 9 | #B4505E | #F2A65A | Dark |
| Night | 10 | #0D1830 | #2A2550 | Dark |

### Kites

| Kite | Chapters | Main colour | Second colour | Meaning |
| --- | --- | --- | --- | --- |
| Kite 1 | 0 to 3 | Magenta #D6336C | Yellow #F2C230 | Childhood, Vadodara and Kota |
| Kite 2 | 3 to 6 | Saffron #F08C00 | White #FFF8EE | After the loss, the building years |
| Kite 3 | 7 to 10 | Teal #1C7C7D | White #FFF8EE | Starting fresh: Chingari, IIMA, the future |
| Rival kites | All | Muted blues, greens, purples at 70% saturation |  | Other lives on other terraces |

Lanterns: warm amber #FFB547 core with a soft orange glow #FF8A3D.

### Typography (Google Fonts)

- **Headings:** Fraunces, weight 600. Hero 56 px desktop, 40 px mobile. Card titles 22 px.
- **Body:** Inter, weight 400 and 600. 17 px desktop, 16 px mobile, line height 1.55.
- **Gujarati accent:** Noto Sans Gujarati, used only for the word ઉત્તરાયણ on the opening screen.
- **Numbers and stats:** Inter 600 with tabular figures.
- Minimum text size anywhere: 14 px.

### UI components

- **Story card:** frosted panel. Light style: background rgba(255, 252, 247, 0.82), text #1F2430. Dark style: background rgba(13, 24, 48, 0.72), text #F5F1EA. Radius 16 px, padding 24 px, blur 12 px, max width 420 px.
- **Stat line:** below the card body, 15 px, Inter 600, separated by a thin rule.
- **Choice cards:** two equal buttons, side by side on desktop, stacked on mobile. Each has a bold label and a one-line subtext. Hover lifts 4 px. Visible focus ring 3 px in the current kite colour.
- **Reveal badges:** two pills, "You chose" in outline style and "I chose" filled in the current kite colour.
- **Hold button:** circular, 72 px, with a ring that fills over 1 second while held.
- **Spool icon:** 40 px, top right, with the thread amount shown as a ring.
- **Polaroid photo:** white frame, 12 px border, 40 px bottom border, slight 2 degree tilt, soft shadow.
- **Motion:** cards fade in and rise 24 px over 500 ms with an ease-out curve. Sky colour transitions over the altitude band, never on a timer.

## 6. 3D scene specification

One full-screen WebGL canvas sits behind the HTML layer. Everything is built in code from simple shapes, so no 3D model files are needed. Keep the 3D light and stylised: the story carries the site.

### Scene elements

| Element | How to build it | Behaviour |
| --- | --- | --- |
| Sky | Full-screen quad with a gradient shader (top colour, horizon colour as uniforms) | Colours blend between chapters by altitude. Sun disc moves from low east (dawn) to high (noon) to low west (sunset); moon and stars at night |
| Clouds | 25 to 40 sprites using soft cloud textures drawn on a canvas at runtime, in 3 depth layers | Drift slowly with wind; parallax as the camera rises. Denser and grey in Chapters 3 and 6 |
| Rooftops | Low-poly flat-roofed houses (extruded boxes), water tanks, parapet walls, a few washing lines, in flat warm colours | Visible at the start and whenever the kite falls in a cut. Dozens of small rival kites hover above them in Chapter 0 |
| Mihir's kite (patang) | Diamond plane with a slight bow, two thin spars, small triangular tail. Paper texture via subtle noise in the shader | Sways with layered sine waves and wind noise. Leans into gusts at decisions. Tumbles and spins during cuts |
| String (manja) | Catmull-Rom curve from bottom-centre of the screen (the flyer's hand, off screen) to the kite's bridle point, drawn as a thin line or tube | Sag changes with tension: tight while climbing, slack in Cut 2, bent sideways at decisions, snaps into two falling pieces at Cut 1 |
| Rival kites | 4 to 8 kites in muted colours at different depths | Drift and bob. One rival approaches and crosses the string at Cut 1 |
| Chip kites | Small kites carrying HTML labels (Chapters 4 and 9) | Fly in a loose group near Mihir's kite; tap to expand |
| Birds | A small flock of 6 to 10 simple V-shaped sprites | Cross the sky once in Chapters 1 and 2 |
| Lanterns (tukkal) | Small glowing cylinders with an additive glow sprite; 40 to 60 background lanterns, 3 larger hero lanterns | Rise slowly with a gentle flicker. Hero lanterns carry the goal text and rise when tapped |
| Rain (optional) | Thin line particles | Light rain during Cut 1 only; off under reduced motion |

### Camera

- Follows the kite with a soft lag, keeping the kite in the upper-middle of the screen on mobile and the left-middle on desktop (cards take the right side).
- Altitude maps to camera height. Field of view stays fixed.
- At decisions, the camera pulls back slightly to show the gust and the bent string.
- During cuts, the camera follows the falling kite down toward the rooftops, then holds while the relaunch button appears.
- In the ending, the camera tilts up to the night sky as lanterns rise.

### Opening shot (Chapter 0)

- Start low, among the rooftops at dawn, looking up at a sky already full of other kites.
- Distant ambient sound of a crowd (if sound is on).
- On "Hold to launch", the kite lifts from the parapet, the camera rises with it, and the hero title fades out.

## 7. Tech stack and architecture

A static site: React + Three.js for the scene, plain HTML for all text, one content file for all copy. No backend.

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite + TypeScript | Fast dev server, static output |
| UI | React 18 | Cards, menus and story mode as components |
| 3D | Three.js via @react-three/fiber and @react-three/drei | Declarative scene that reads the same state as the UI |
| Animation | GSAP for card, camera and cut sequences | Precise timelines for the cut and reveal moments |
| State | Zustand | One store shared by the scene and the UI |
| Styling | CSS modules or plain CSS with variables | Sky-dependent light and dark card styles |
| Audio | Howler.js | Simple layered sound with a global mute |
| Hosting | Vercel (or Netlify) | Free, one-command deploy, shareable URL |

### Store shape

```ts
type Phase = 'intro' | 'flying' | 'deciding' | 'revealing' | 'cut' | 'relaunch' | 'ending';

interface FlightState {
  phase: Phase;
  altitude: number;          // 0 to 900, damped
  targetAltitude: number;    // raw input value
  chapterIndex: number;      // 0 to 10
  kite: 1 | 2 | 3;
  choices: Record<string, 'A' | 'B'>; // keyed by decision id
  visited: number[];         // chapter indexes reached
  sound: boolean;
  mode: 'flight' | 'story';
  presenter: boolean;
}
```

### Content model (`src/content/story.ts`)

```ts
interface StoryCard { id: string; title?: string; body: string; stat?: string; photo?: string; }

interface Decision {
  id: string;              // 'kota', 'branch', 'rto', 'wictronix', 'mba'
  name: string;            // short name for the comparison table
  prompt: string;
  options: { A: { label: string; sub: string }; B: { label: string; sub: string } };
  mihir: 'A' | 'B';
  reveal: string;
  result?: string;
}

interface Chapter {
  index: number;
  title: string;
  altitude: number;        // trigger altitude in metres
  sky: string;             // key into the sky palette
  kite: 1 | 2 | 3;
  cards: StoryCard[];
  chips?: StoryCard[];
  decision?: Decision;
  cut?: 'snap' | 'slack';
}
```

Example entry:

```ts
{
  index: 1, title: 'Leaving home', altitude: 100, sky: 'earlyMorning', kite: 1, cards: [],
  decision: {
    id: 'kota', name: 'Leaving home at 16',
    prompt: 'You are 16. Your teachers know you well and have promised to take the best care of you if you stay. Or you can move alone to Kota, where you know no one and everything is unknown.',
    options: { A: { label: 'Stay home', sub: 'Familiar teachers, family, comfort.' }, B: { label: 'Go to Kota', sub: 'A new city, on your own.' } },
    mihir: 'B',
    reveal: 'I chose Kota. Staying was the comfortable option, and I wanted to find out how far I could go without it.',
    result: 'Class XII: 95.8%, rank 5 of 171. KVPY Fellowship, All India Rank 191. JEE Mains: 99.64 percentile.'
  }
}
```

### File structure

```text
kite-story/
  SPEC.md
  index.html
  public/
    photos/            # Mihir's photos, WebP, max 1600 px wide
    audio/             # wind.mp3, crowd.mp3, creak.mp3, kaipoche.mp3, bells.mp3
    og-image.jpg       # 1200 x 630 still of the kite at sunset
    favicon.svg        # small kite
  src/
    main.tsx
    App.tsx
    content/story.ts   # ALL copy and chapter data
    content/palette.ts # sky and kite colours
    state/store.ts
    input/useFlightInput.ts   # wheel, touch, keys to altitude
    scene/Scene.tsx
    scene/Sky.tsx
    scene/Clouds.tsx
    scene/Rooftops.tsx
    scene/Kite.tsx
    scene/String.tsx
    scene/RivalKites.tsx
    scene/Lanterns.tsx
    scene/CameraRig.tsx
    ui/StoryCard.tsx
    ui/DecisionPanel.tsx
    ui/RevealCard.tsx
    ui/CutSequence.tsx
    ui/HoldButton.tsx
    ui/SpoolMenu.tsx
    ui/Ending.tsx
    ui/StoryMode.tsx   # linear readable page
    audio/sound.ts
    styles/
```

## 8. Accessibility, performance and fallbacks

The site must load in under 3 seconds on a mid-range Android phone over 4G and still tell the full story when 3D is unavailable.

### Story mode (fallback and choice)

- A normal scrolling page with the same chapters, cards, photos and decisions. Decisions work as two buttons with the reveal shown below after a choice. The comparison and lanterns appear at the end as static elements.
- Shown automatically when WebGL is unavailable or the device is very low-end (fewer than 4 CPU cores and under 4 GB memory, where the browser reports it).
- Offered as a choice on the intro screen ("Read the story instead") and in the spool menu.

### Accessibility

- All text is real HTML, never drawn inside the canvas. The canvas is marked `aria-hidden`.
- Decisions are real `<button>` elements, reachable with Tab and Enter, with visible focus.
- Each new card is announced through an `aria-live="polite"` region.
- `prefers-reduced-motion`: no camera shake, no rain, gentler sway, cuts shown as a fade instead of a tumble, and a prompt suggesting story mode.
- Text contrast at least 4.5:1 on cards over every sky colour (check sunset and overcast especially).
- Hold buttons also accept a single click for keyboard and switch users.

### Performance budget

| Item | Budget |
| --- | --- |
| JavaScript, gzipped, initial load | 450 KB or less |
| Fonts | 3 families, subset, `font-display: swap` |
| Photos | WebP, 200 KB or less each, lazy loaded one chapter ahead |
| Audio | 1.5 MB total, loaded only after sound is turned on |
| Frame rate | 60 fps on laptops, 30 fps or more on mid-range phones |
| Device pixel ratio | Capped at 2 on desktop, 1.5 on mobile |
| Lighthouse (mobile) | Performance 80+, Accessibility 95+ |

Pause rendering when the tab is hidden. Reduce cloud and lantern counts by half on mobile.

### Mobile layout

- Portrait first. Kite in the top half, cards as a bottom sheet (max 45% of screen height).
- Swipe up to climb. Choice cards stack vertically, each at least 56 px tall.
- Safe-area padding for notched phones. Test on a 360 px wide screen.

### Sharing and metadata

- Page title: Mihir Gandhi | The Kite
- Description: An interactive story told in one kite flight over Vadodara.
- Open Graph image: a still of Kite 3 at sunset with lanterns (1200 x 630).
- Favicon: the teal kite.

## 9. Build phases and acceptance criteria

Build in six phases. Claude Code stops after each phase so Mihir can review in the browser. Story mode comes first so the content is complete and correct before any 3D work.

### Phase 1: Project and content

Set up Vite, React, TypeScript, the store, `story.ts` with every line from Section 3, and the full story mode page.

- [ ] `npm run dev` starts with no errors or warnings
- [ ] Every line from Section 3 appears in story mode, word for word
- [ ] All 5 decisions work in story mode and the comparison shows the right score
- [ ] A search of `src/` finds no em dash characters
- [ ] Story mode reads well at 360 px and 1440 px widths

### Phase 2: Sky, kite and flight

Add the canvas, gradient sky, clouds, Kite 1, string, camera rig and altitude input. Story cards appear by altitude.

- [ ] Wheel, trackpad, keys and swipe all move the kite smoothly, with no jumps
- [ ] Sky colours blend through all 11 chapters from dawn to night
- [ ] Cards appear and disappear in the right altitude bands on desktop and mobile
- [ ] 60 fps on a laptop, 30 fps or more on a mid-range phone

### Phase 3: Decisions and ending

Add the climb lock, gust animation, choice cards, reveal with badges, and the comparison panel.

- [ ] Climb is locked at each of the 5 decisions until a choice is made
- [ ] Both options look equal; nothing hints at Mihir's answer
- [ ] Reveal shows "You chose" and "I chose" correctly for both options
- [ ] Comparison score and note match the rules in Section 3

### Phase 4: Cuts, kites and lanterns

Add rival kites, Cut 1 (snap) and Cut 2 (slack), the relaunch hold button, the kite changes (1 to 2 to 3), and the lantern ending.

- [ ] Cut 1 plays fully: rival kite, "Kai po che!", snap, fall, cards, relaunch with Kite 2
- [ ] Cut 2 plays fully: slack, drift, two kites on the rooftop, reveal, launch of Kite 3
- [ ] Tapping each hero lantern releases it with its goal text
- [ ] Reduced-motion version of both cuts works

### Phase 5: Opening, sound, photos and presenter mode

Add the rooftop opening shot, hold-to-launch, sound layers, photo slots, the spool menu and presenter mode.

- [ ] Opening shot starts among rooftops at dawn with other kites in the sky
- [ ] Sound is off by default; turning it on plays the layers in Section 4
- [ ] Photo slots show polaroids when a file exists and hide cleanly when it does not
- [ ] `?present` and the P key start auto-climb with larger text
- [ ] Spool menu lists chapters, locks unvisited ones, and toggles sound and story mode

### Phase 6: QA and deploy

- [ ] Tested on Chrome and Safari (desktop), Safari on iPhone, Chrome on Android
- [ ] Story mode loads automatically when WebGL is turned off
- [ ] Lighthouse mobile: Performance 80+, Accessibility 95+
- [ ] Open Graph image and favicon in place; link preview checked on WhatsApp
- [ ] Deployed to Vercel with a clean URL; full flight checked on the live link

## 10. Items to confirm before launch

None of these block the build. Claude Code uses the current draft and Mihir updates `story.ts` later.

- [ ] Reveal wording for Decision 1 (Kota), Decision 2 (NIT CSE over IIT) and Decision 4 (leaving WictroniX for Chingari): the reasons are drafts
- [ ] The three lantern goals
- [ ] Photos: which ones, and which chapter each belongs to (suggested slots: Chapter 0 childhood or family, Chapter 4 NIT Surat or WictroniX team, Chapter 9 IIMA)
- [ ] Contact links: email (suggested mihirgandhi1407@gmail.com rather than the IIMA address) and the exact LinkedIn URL. Phone number is not shown
- [ ] Course submission format: live URL, code zip, or both, and the deadline
- [ ] Domain or Vercel project name
