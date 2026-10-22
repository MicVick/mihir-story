// ALL on-screen copy and chapter data lives in this file.
// Components never hardcode copy. Rules: simple, professional language,
// no em dashes, numbers exactly as written in SPEC.md Section 3.
// Lines marked [CONFIRM] are drafts Mihir will check before launch.

import type { SkyKey } from './palette';

export type Choice = 'A' | 'B';
export type KiteId = 1 | 2 | 3;

export interface StoryCard {
  id: string;
  title?: string;
  body?: string;
  stat?: string;
  /** Path under /public, e.g. '/photos/terrace.webp'. Hidden cleanly if the file is missing. */
  photo?: string;
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
  /** When set, the chips open the chapter as a titled highlights card. Otherwise they follow the cards. */
  chipsTitle?: string;
  decision?: Decision;
  cut?: 'snap' | 'slack';
}

export const meta = {
  title: 'Mihir Gandhi | The Kite',
  description: 'An interactive story told in one kite flight over Vadodara.',
};

export const intro = {
  loader: 'Tying the string...',
  gujarati: 'ઉત્તરાયણ',
  gujaratiLatin: '(Uttarayan)',
  heroTitle: 'Mihir Gandhi',
  heroSubtitle: 'One flight. Five decisions. Two cut kites.',
  launch: 'Hold to launch',
  readStory: 'Read the story instead',
  hint: 'Scroll or swipe up to fly higher.',
};

export const ui = {
  windLabel: 'The wind shifts.',
  youChose: 'You chose',
  iChose: 'I chose',
  rivalShout: 'Kai po che!',
  retie: 'Re-tie the string',
  continue: 'Continue',
  comparisonLocked: 'Make all five choices above to see how your flight compares with mine.',
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
        body: 'Every January, Vadodara moves to its rooftops. This is where I grew up, studying at Bright School and spending Uttarayan on the terrace with my family. My father ran a small business in the city.',
        stat: 'Class X: 92.5%, top 0.36% in the state.',
        // Suggested photo slot: childhood or family, e.g. photo: '/photos/terrace.webp'
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
      prompt: 'You are 16. Your teachers know you well and have promised to take the best care of you if you stay. Or you can move alone to Kota, where you know no one and everything is unknown.',
      options: {
        A: { label: 'Stay home', sub: 'Familiar teachers, family, comfort.' },
        B: { label: 'Go to Kota', sub: 'A new city, on your own.' },
      },
      mihir: 'B',
      // [CONFIRM]
      reveal: 'I chose Kota. Staying was the comfortable option, and I wanted to find out how far I could go without it.',
      result: 'Class XII: 95.8%, rank 5 of 171. KVPY Fellowship, All India Rank 191. JEE Mains: 99.64 percentile.',
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
      prompt: 'Your rank opens two doors. Civil or Mechanical Engineering at IIT Delhi or IIT Bombay. Or Computer Science at NIT Surat.',
      options: {
        A: { label: 'IIT, Civil or Mechanical', sub: 'A top IIT on your degree.' },
        B: { label: 'NIT Surat, Computer Science', sub: 'The branch you want to study.' },
      },
      mihir: 'B',
      // [CONFIRM]
      reveal: 'I chose Computer Science at NIT Surat. I wanted to build with technology, and the subject mattered more to me than the name on the gate.',
    },
  },
  {
    index: 3,
    title: 'The cut',
    period: '19',
    altitude: 250,
    fallTo: 60,
    sky: 'overcast',
    kite: 1,
    cut: 'snap',
    cards: [
      {
        id: 'cut-1',
        body: "At 19, I lost my father to COVID-19. Restrictions meant our relatives could not come to help. Overnight, I was managing the family's finances, taxes and my father's business, and looking after my mother and two younger brothers, while still in college.",
      },
      {
        id: 'cut-2',
        body: 'It taught me to stay calm under pressure and to be grateful for what I have. It also gave me a reason. I had seen what the pandemic did to small businesses like his.',
      },
    ],
  },
  {
    index: 4,
    title: 'Building',
    period: 'NIT Surat years',
    altitude: 300,
    sky: 'noon',
    kite: 2,
    cards: [
      {
        id: 'nexus',
        body: "After COVID, campus came back without its culture. Seniors and juniors barely met. With a few classmates, I convinced the HoD and professors to start Nexus, the Computer Science department's official club: hackathons, seminars, sports and cultural events. Engagement grew 200% in a year.",
        // Suggested photo slot: NIT Surat or WictroniX team
      },
      {
        id: 'wictronix',
        body: 'In 2022, I co-founded WictroniX to help small businesses adopt technology and digital tools. It became a DPIIT-recognised startup with 50 clients across 8 industries and 3 countries, and ₹40 lakh in revenue.',
      },
    ],
    chips: [
      { id: 'ecell', body: 'E-Cell Convenor, NIT Surat: 9 events, 2,000+ students' },
      { id: 'ai-lms', body: 'AI-LMS piloted with 800+ students at MS University, ₹4 lakh government grant' },
    ],
  },
  {
    index: 5,
    title: 'The offer',
    period: 'WictroniX years',
    altitude: 400,
    sky: 'earlyAfternoon',
    kite: 2,
    cards: [],
    decision: {
      id: 'rto',
      name: 'The RTO data project',
      prompt: 'A client offers WictroniX a large payout to build software that cleans and searches personal data from RTO records. Then you learn the data was obtained unethically. Half your team wants to take it.',
      options: {
        A: { label: 'Take the project', sub: 'A big payout. You only write the code.' },
        B: { label: 'Walk away', sub: 'Turn down the money.' },
      },
      mihir: 'B',
      reveal: 'I argued to walk away, and after long debates the team agreed. Integrity comes before profit, especially when no one else would know.',
    },
  },
  {
    index: 6,
    title: 'The stall',
    period: '2024, graduation',
    altitude: 450,
    // Both cuts land on the rooftops, so Decision 4 can show two kites on a terrace.
    fallTo: 60,
    sky: 'hazyAfternoon',
    kite: 2,
    cut: 'slack',
    cards: [
      {
        id: 'stall',
        body: 'By 2024, WictroniX had stopped growing. I had misjudged demand in some segments, struggled to keep clients for the long term, and had not built a team structure that could scale. Passion and effort had taken us far, but not far enough.',
      },
    ],
    decision: {
      id: 'wictronix',
      name: 'WictroniX or something new',
      prompt: 'Graduation is weeks away and your kite has fallen. Re-tie the same one, or pick up a new kite?',
      options: {
        A: { label: 'Keep building WictroniX', sub: 'Fix it from the inside.' },
        B: { label: 'Do something else', sub: 'Step away and start fresh.' },
      },
      mihir: 'B',
      // [CONFIRM]
      reveal: 'I stepped away and joined Chingari, a Series A startup, as an Associate Product Manager. I wanted to learn how a funded company builds and scales products, the exact part I had struggled with.',
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
        body: 'At Chingari, I co-led AstroLive, an astrology livestreaming product, from zero. Leadership wanted to reuse the Chingari codebase to launch faster. I believed the two business models were too different, so the Engineering Manager and I built a feature-level demo to show why. We built AstroLive from scratch.',
      },
      {
        id: 'astrolive-growth',
        body: 'AstroLive grew to 280K monthly active users and 62% month-on-month revenue growth, with a 24-member cross-functional team. I also integrated a UPI gateway that now processes ₹2 crore+ every month.',
      },
    ],
  },
  {
    index: 8,
    title: 'The leap',
    period: '22 (2024)',
    altitude: 650,
    sky: 'goldenHour',
    kite: 3,
    cards: [],
    decision: {
      id: 'mba',
      name: 'Product manager or MBA',
      prompt: 'You are 22 and leading a product that grows every month. You could stay and grow as a product manager. Or you could leave for two years of business school.',
      options: {
        A: { label: 'Stay a product manager', sub: 'Keep the momentum.' },
        B: { label: 'Go for an MBA', sub: 'Two years away from building.' },
      },
      mihir: 'B',
      reveal: 'WictroniX had shown me my gaps in strategy, finance and scale, and I wanted to close them before building again. I scored 99.51 percentile in CAT 2024 and joined IIM Ahmedabad as a Praxis Scholar.',
    },
  },
  {
    index: 9,
    title: 'IIM Ahmedabad',
    period: '2025 to today',
    altitude: 750,
    sky: 'sunset',
    kite: 3,
    chipsTitle: 'IIM Ahmedabad, 2025 to today',
    chips: [
      { id: 'amazon', body: 'Amazon: Program Manager Intern. Built an ML tool that explains about 85% of what moves GMS in vendor discussions.' },
      { id: 'picus', body: 'Picus Capital: Student Venture Partner, scouting early-stage startups.' },
      { id: 'entrevc', body: "EntreVC: Club Coordinator. Hosted a fireside chat with Sarvam AI's founding engineer." },
      { id: 'cultcomm', body: 'CultComm: 1 of 22 selected from 160+ applicants.' },
    ],
    cards: [
      {
        id: 'beyond-work',
        body: 'Off the terrace, I travel, often to spiritual places like Palitana, Varanasi and Shravanabelagola. I read non-fiction, play chess and table tennis, and my writing on Quora has 100K+ views.',
        // Suggested photo slot: IIMA
      },
    ],
  },
  {
    index: 10,
    title: 'Lanterns',
    period: 'The future',
    altitude: 850,
    sky: 'night',
    kite: 3,
    cards: [],
  },
];

export const ending = {
  intro: 'Night falls. Every terrace lights a lantern.',
  instruction: 'Tap a lantern to release it.',
  lanterns: [
    { id: 'lantern-1', text: 'Return to entrepreneurship.' }, // [CONFIRM]
    { id: 'lantern-2', text: 'Build technology that makes small businesses resilient.' }, // [CONFIRM]
    { id: 'lantern-3', text: "Solve problems at India's scale, with economic and social impact." }, // [CONFIRM]
  ],
  /** {n} is replaced with the number of matching choices. */
  comparisonHeading: 'You flew {n} of 5 the way I did.',
  comparisonNotes: {
    all: 'We would share a terrace.',
    close: 'Close. We just read the wind differently.',
    far: 'You would fly a different kite. I would like to hear why.',
  },
  closing: 'Most kites get cut eventually. What matters is whether you go back to the terrace.',
  buttons: {
    flyAgain: 'Fly again',
    readStory: 'Read the story',
    email: 'Email me',
    linkedin: 'LinkedIn',
  },
  contact: {
    email: 'mihirgandhi1407@gmail.com', // [CONFIRM]
    linkedin: 'https://www.linkedin.com/in/your-handle', // [CONFIRM] replace with the exact LinkedIn URL
  },
};

export const decisions: Decision[] = chapters.flatMap((c) => (c.decision ? [c.decision] : []));
