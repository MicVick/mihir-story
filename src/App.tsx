import { lazy, Suspense, useEffect } from 'react';
import { intro } from './content/story';
import { useFlight } from './state/store';
import { StoryMode } from './ui/StoryMode';

// Three.js loads only for visitors who fly, so story mode stays light.
const Flight = lazy(() => import('./ui/Flight'));

export function App() {
  const mode = useFlight((s) => s.mode);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  if (mode === 'story') return <StoryMode />;
  return (
    <Suspense fallback={<p className="loader">{intro.loader}</p>}>
      <Flight />
    </Suspense>
  );
}
