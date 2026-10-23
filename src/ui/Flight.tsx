import { Component, useEffect, type ReactNode } from 'react';
import { useSoundCues } from '../audio/useSoundCues';
import { useFlightInput } from '../input/useFlightInput';
import { Scene } from '../scene/Scene';
import { useFlight } from '../state/store';
import { FlightOverlay } from './FlightOverlay';
import { usePresenter } from './usePresenter';
import { WindStreaks } from './WindStreaks';

/** The interactive flight: WebGL scene behind, all text as HTML in front. */
export default function Flight() {
  useFlightInput(true);
  useSoundCues();
  usePresenter();

  useEffect(() => {
    document.documentElement.classList.add('is-flying');
    return () => document.documentElement.classList.remove('is-flying');
  }, []);

  return (
    <div className="flight">
      <div className="flight__canvas" aria-hidden="true">
        <SceneBoundary>
          <Scene />
        </SceneBoundary>
      </div>
      {/* Paper grain and a soft vignette over the scene, under the text. */}
      <div className="flight__finish" aria-hidden="true" />
      <WindStreaks />
      <FlightOverlay />
    </div>
  );
}

/** If WebGL fails after all, fall back to story mode instead of a blank page. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    useFlight.getState().setMode('story');
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
