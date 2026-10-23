// ALL on-screen copy and chapter data lives in this file.
// Components never hardcode copy. Rules: plain, spoken language (write it the
// way Mihir would say it), no em or en dashes, numbers exactly as written in
// SPEC.md Section 3.

import type { SkyKey } from './palette';

export type Choice = 'A' | 'B';
export type KiteId = 1 | 2 | 3;

/** A number worth stopping for. `value` is shown exactly as written; its digits count up in flight. */
export interface Milestone {
  value: string;
  label: string;
}

export interface StoryCard {
  id: string;
  title?: string;
  body?: string;
  stat?: string;
  /** File name in public/photos, e.g. 'terrace.webp'. The polaroid only shows once the file exists. */
  photo?: string;
  /** Describes the photo for screen readers. */
  photoAlt?: string;
  milestone?: Milestone;
}

export interface Decision {
  id: 'kota' | 'branch' | 'rto' | 'wictronix' | 'mba';
  /** Short name for the comparison table. */
  name: string;
  prompt: string;
  options: Record<Choice, { label: string; sub: string }>;
  mihir: Choice;
  reveal: string;
  result?: string;
  milestone?: Milestone;
}

export interface Chapter {
  index: number;
  title: string;
  /** Mihir's age or period, shown as a small eyebrow. */
  period: string;
  /** Trigger altitude in metres. */
  altitude: number;
  /** Altitude the kite falls to in a cut. */
  fallTo?: number;
  sky: SkyKey;
  kite: KiteId;
  cards: StoryCard[];
  chips?: StoryCard[];
  /** Heading for the chips card. */
  chipsTitle?: string;
  /** The chips open the chapter. Otherwise they follow the cards. */
  chipsFirst?: boolean;
  decision?: Decision;
  cut?: 'snap' | 'slack';
}

export const meta = {
  title: 'Mihir Gandhi | The Kite',
  description: 'My story, told as one kite flight over Vadodara on Uttarayan.',
};

export const intro = {
  loader: 'Tying the string...',
  gujarati: 'ઉત્તરાયણ',
  gujaratiLatin: '(Uttarayan)',
  heroTitle: 'Mihir Gandhi',
  heroSubtitle: "Take my kite up. On the way, you'll face the five calls I had to make.",
  launch: 'Hold to launch',
  readStory: 'Read the story instead',
  music: 'Play with music',
  musicOn: 'Music on',
  hint: 'Scroll or swipe up to let out more string.',
  reducedMotion: 'Your device is set to reduce motion. You can read all of this as a normal page instead.',
  reducedMotionRead: 'Read it as a page',
  reducedMotionStay: 'Fly anyway',
};

export const menu = {
  open: 'Open the chapter menu',
  close: 'Close',
  heading: 'Chapters',
  locked: 'Not reached yet',
  sound: 'Music and sound',
  soundOn: 'Turn music and sound on',
  soundOff: 'Turn music and sound off',
  on: 'On',
  off: 'Off',
  presenter: 'Presenter mode',
  presenterHint: 'Press P to start or stop',
  readStory: 'Read the story instead',
  progress: 'Flight progress',
  credits: 'Music: piano from the Salamander Grand Piano by Alexander Holm (CC BY 3.0); flute, strings and harp from tonejs-instruments.',
};

export const ui = {
  windLabel: 'The wind shifts.',
  youChose: 'You chose',
  iChose: 'I chose',
  rivalShout: 'Kai po che!',
  chapter: 'Chapter',
  newKite: 'A new kite',
  milestone: 'Milestone',
  setback: 'Setback',
  retie: 'Re-tie the string',
  continue: 'Continue',
  comparisonLocked: 'Make all five calls to see how your flight compares with mine.',
  tableDecision: 'Decision',
  tableYours: 'Your choice',
  tableMine: 'My choice',
};

export const chapters: Chapter[] = [
  {
    index: 0,
    title: 'The terrace',
    period: 'Childhood, Vadodara',
    altitude: 0,
    sky: 'dawn',
    kite: 1,
    cards: [
      {
        id: 'terrace',
        title: 'Where I grew up',
        body: 'I grew up in Vadodara and went to Bright School. Every Uttarayan, the whole city goes up to its roofs, and my family spent the day on this terrace. My father ran a small business in town.',
        stat: 'Class X: 92.5%, top 0.36% in the state.',
        // Photo slot: childhood or family. Add public/photos/terrace.webp to show it.
        photo: 'terrace.webp',
        photoAlt: 'Mihir as a child with his family on the terrace in Vadodara',
      },
    ],
  },
  {
    index: 1,
    title: 'Leaving home',
    period: '16 (2018)',
    altitude: 100,
    sky: 'earlyMorning',
    kite: 1,
    cards: [],
    decision: {
      id: 'kota',
      name: 'Leaving home at 16',
      prompt: "You're 16. Your teachers at home know you well, and they've promised to look after you if you stay. Or you can move to Kota on your own, where you don't know a single person.",
      options: {
        A: { label: 'Stay home', sub: 'Teachers you know, family, comfort.' },
        B: { label: 'Go to Kota', sub: 'A new city, on your own.' },
      },
      mihir: 'B',
     
      reveal: "I went to Kota. Staying would have been easier, and I think that's exactly why I didn't. I wanted to see what I could manage on my own.",
      result: 'Class XII: 95.8%, rank 5 of 171. KVPY Fellowship, All India Rank 191. JEE Mains: 99.64 percentile.',
      milestone: { value: '99.64', label: 'percentile in JEE Mains' },
    },
  },
  {
    index: 2,
    title: 'The branch',
    period: '18 (2020)',
    altitude: 200,
    sky: 'morning',
    kite: 1,
    cards: [],
    decision: {
      id: 'branch',
      name: 'IIT or NIT Surat CSE',
      prompt: 'Your rank gets you Civil or Mechanical Engineering at IIT Delhi or IIT Bombay, or Computer Science at NIT Surat. You can only take one.',
      options: {
        A: { label: 'IIT, Civil or Mechanical', sub: 'The IIT name on your degree.' },
        B: { label: 'NIT Surat, Computer Science', sub: 'The subject you actually want.' },
      },
      mihir: 'B',
     
      reveal: "I took Computer Science at NIT Surat. I wanted to build things with software, and I didn't want to spend four years on a subject I'd only picked for the IIT name.",
    },
  },
  {
    index: 3,
    title: 'Losing my father',
    period: '19 (2021)',
    altitude: 250,
    // The cut kite falls all the way back to the home terrace.
    fallTo: 0,
    sky: 'overcast',
    kite: 1,
    cut: 'snap',
    cards: [
      {
        id: 'cut-1',
        body: "I was 19 when my father died of COVID-19. Because of the restrictions, none of our relatives could come and help. Almost overnight I was handling the family's money, the taxes and his business, and looking after my mother and my two younger brothers. I was still in college.",
      },
      {
        id: 'cut-2',
        title: 'What it left me with',
        body: "Those months taught me to stay calm when things go wrong, and to be grateful for what I still had. I'd also seen up close what the pandemic did to small businesses like his, and I couldn't stop thinking about it.",
      },
    ],
  },
  {
    index: 4,
    title: 'Building',
    period: 'NIT Surat, 2020 to 2024',
    altitude: 300,
    sky: 'noon',
    kite: 2,
    cards: [
      {
        id: 'nexus',
        title: 'Bringing campus back to life',
        body: 'When college reopened after COVID, it felt empty. Seniors and juniors hardly knew each other. A few classmates and I went to the HoD and our professors and talked them into starting Nexus, an official club for the Computer Science department. We ran hackathons, seminars, sports and cultural events, and engagement grew 200% in a year.',
        // Photo slot: NIT Surat or the WictroniX team. Add public/photos/building.webp to show it.
        photo: 'building.webp',
        photoAlt: 'Mihir with his team at NIT Surat',
        milestone: { value: '200%', label: 'growth in engagement in one year' },
      },
      {
        id: 'wictronix',
        title: 'Starting WictroniX',
        body: 'In 2022 I co-founded WictroniX to help small businesses, like the one my father ran, start using technology and digital tools. We were recognised by DPIIT as a startup, and we got to 50 clients in 8 industries and 3 countries, with ₹40 lakh in revenue.',
        milestone: { value: '₹40 lakh', label: 'in revenue, from 50 clients in 3 countries' },
      },
    ],
    chipsTitle: 'Also at NIT Surat',
    chips: [
      { id: 'ecell', body: 'E-Cell Convenor, NIT Surat: 9 events, 2,000+ students' },
      { id: 'ai-lms', body: 'AI-LMS piloted with 800+ students at MS University, ₹4 lakh government grant' },
    ],
  },
  {
    index: 5,
    title: 'The offer',
    period: 'Running WictroniX',
    altitude: 400,
    sky: 'earlyAfternoon',
    kite: 2,
    cards: [],
    decision: {
      id: 'rto',
      name: 'The RTO data project',
      prompt: "A client offers WictroniX a lot of money to build software that cleans and searches people's personal data from RTO records. Then you find out how that data was collected, and it wasn't ethical. Half your team still wants the deal.",
      options: {
        A: { label: 'Take the project', sub: "Big money. You'd only be writing the code." },
        B: { label: 'Walk away', sub: 'Say no to the money.' },
      },
      mihir: 'B',
      reveal: "I wanted us to walk away. We argued about it for a long time before the team agreed. Nobody outside would ever have known if we'd taken it. We would have known, though.",
    },
  },
  {
    index: 6,
    title: 'The stall',
    period: '2024, graduation',
    altitude: 450,
    // Both cuts land on the home terrace, so Decision 4 can show two kites side by side there.
    fallTo: 0,
    sky: 'hazyAfternoon',
    kite: 2,
    cut: 'slack',
    cards: [
      {
        id: 'stall',
        title: 'Why WictroniX stalled',
        body: "By 2024, WictroniX had stopped growing, and a lot of that was on me. I'd misread demand in some segments. We couldn't hold on to clients for long. And I hadn't built a team structure that could grow with us. Hard work had got us this far. It wasn't going to get us further.",
      },
    ],
    decision: {
      id: 'wictronix',
      name: 'WictroniX or something new',
      prompt: 'Graduation is a few weeks away, and your kite is on the ground. Do you re-tie the same one, or pick up a new kite?',
      options: {
        A: { label: 'Keep building WictroniX', sub: "Stay and fix what's broken." },
        B: { label: 'Do something else', sub: 'Step away and learn somewhere new.' },
      },
      mihir: 'B',
     
      reveal: "I stepped away and joined Chingari, a Series A startup, as an Associate Product Manager. Scaling was exactly where I'd got stuck, so I wanted to see how a funded company really builds and grows a product.",
    },
  },
  {
    index: 7,
    title: 'Chingari',
    period: '2024 to 2025',
    altitude: 550,
    sky: 'lateAfternoon',
    kite: 3,
    cards: [
      {
        id: 'astrolive',
        title: 'Building AstroLive',
        body: 'At Chingari I co-led AstroLive, an astrology livestreaming app, from zero. Leadership wanted to reuse the Chingari codebase so we could launch faster. I thought the two businesses were too different for that, so our Engineering Manager and I built a feature-level demo to show them why. In the end, we built AstroLive from scratch.',
      },
      {
        id: 'astrolive-growth',
        title: 'What it grew into',
        body: 'AstroLive grew to 280K monthly active users, and revenue grew 62% month on month. We did it with a cross-functional team of 24. I also set up the UPI gateway, which now handles ₹2 crore+ every month.',
        milestone: { value: '280K', label: 'monthly active users on AstroLive' },
      },
    ],
  },
  {
    index: 8,
    title: 'The leap',
    period: '22, CAT 2024',
    altitude: 650,
    sky: 'goldenHour',
    kite: 3,
    cards: [],
    decision: {
      id: 'mba',
      name: 'Product manager or MBA',
      prompt: "You're 22, and the product you lead is growing every month. You could stay and keep growing as a product manager. Or you could leave it for two years of business school.",
      options: {
        A: { label: 'Stay a product manager', sub: "Keep going while it's working." },
        B: { label: 'Go for an MBA', sub: 'Two years away from building.' },
      },
      mihir: 'B',
      reveal: "WictroniX had shown me how much I didn't know about strategy, finance and scale, and I wanted to fix that before I built anything again. I took CAT 2024, got 99.51 percentile, and joined IIM Ahmedabad as a Praxis Scholar.",
      milestone: { value: '99.51', label: 'percentile in CAT 2024' },
    },
  },
  {
    index: 9,
    title: 'IIM Ahmedabad',
    period: '2025 to today',
    altitude: 750,
    sky: 'sunset',
    kite: 3,
    chipsTitle: 'Outside the classroom',
    chipsFirst: true,
    chips: [
      { id: 'amazon', body: 'Amazon: Program Manager Intern. Built an ML tool that explains about 85% of what moves GMS in vendor discussions.' },
      { id: 'picus', body: 'Picus Capital: Student Venture Partner, scouting early-stage startups.' },
      { id: 'entrevc', body: "EntreVC: Club Coordinator. Hosted a fireside chat with Sarvam AI's founding engineer." },
      { id: 'cultcomm', body: 'CultComm: 1 of 22 selected from 160+ applicants.' },
    ],
    cards: [
      {
        id: 'beyond-work',
        title: 'Away from work',
        body: "I like to travel, often to spiritual places like Palitana, Varanasi and Shravanabelagola. I read non-fiction, play chess and table tennis, and I write on Quora, where my answers have 100K+ views.",
        // Photo slot: IIM Ahmedabad. Add public/photos/iima.webp to show it.
        photo: 'iima.webp',
        photoAlt: 'Mihir at IIM Ahmedabad',
      },
    ],
  },
  {
    index: 10,
    title: 'What comes next',
    period: 'Night, the future',
    altitude: 850,
    sky: 'night',
    kite: 3,
    cards: [],
  },
];

export const ending = {
  intro: "It's dark now. All over the city, people are lighting lanterns on their terraces.",
  instruction: 'These three are mine. Tap one to let it go.',
  lanterns: [
    { id: 'lantern-1', text: 'Start a company again.' },
    { id: 'lantern-2', text: 'Help small businesses get through bad years.' },
    { id: 'lantern-3', text: "Work on problems at India's scale." },
  ],
  /** {n} is replaced with the number of matching choices. */
  comparisonHeading: 'You flew {n} of 5 the way I did.',
  comparisonNotes: {
    all: "All five, same as me. We'd get along on a terrace.",
    close: 'Close. We read the wind a little differently.',
    far: "We'd fly very different kites. I'd honestly like to hear why.",
  },
  closing: 'Every kite gets cut sooner or later. I just keep going back up to the terrace with a new one.',
  buttons: {
    flyAgain: 'Fly again',
    readStory: 'Read the story',
    email: 'Email me',
    linkedin: 'LinkedIn',
  },
  contact: {
    email: 'mihirgandhi1407@gmail.com',
    linkedin: 'https://www.linkedin.com/in/mihir--gandhi/',
  },
};

export const decisions: Decision[] = chapters.flatMap((c) => (c.decision ? [c.decision] : []));
