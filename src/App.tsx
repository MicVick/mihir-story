import { lazy, Suspense, useEffect } from 'react';
import { useFlight } from './state/store';
import { IntroHero } from './ui/IntroHero';
import { StoryMode } from './ui/StoryMode';

// Three.js loads only for visitors who fly, so story mode stays light.
const Flight = lazy(() => import('./ui/Flight'));

export function App() {
  const mode = useFlight((s) => s.mode);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  // The title pre-rendered in index.html steps aside once React is on screen.
  useEffect(() => {
    document.getElementById('shell')?.remove();
  }, []);

  if (mode === 'story') return <StoryMode />;
  return (
    <>
      <Suspense fallback={null}>
        <Flight />
      </Suspense>
      {/* Outside the lazy chunk, so the title shows while Three.js loads. */}
      <IntroHero />
    </>
  );
}
