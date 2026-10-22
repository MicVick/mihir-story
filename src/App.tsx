import { StoryMode } from './ui/StoryMode';

// Phase 1: story mode only. The 3D flight arrives in Phase 2 and will render
// here when mode is 'flight' and WebGL is available, with StoryMode as the fallback.
export function App() {
  return <StoryMode />;
}
