import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import './styles/components.css';
import './styles/story.css';
import './styles/flight.css';
import './styles/cinematic.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dev-only handle for checking the flight from the browser console.
if (import.meta.env.DEV) {
  void import('./state/store').then(({ useFlight }) => {
    (window as unknown as { __flight: typeof useFlight }).__flight = useFlight;
  });
}
