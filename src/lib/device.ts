// Decides whether this device gets the 3D flight or story mode.

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Fewer than 4 CPU cores and under 4 GB memory, where the browser reports both. */
export function isLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return cores !== undefined && memory !== undefined && cores < 4 && memory < 4;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function isSmallScreen(): boolean {
  return window.matchMedia?.('(max-width: 768px)').matches ?? false;
}

export function initialMode(): 'flight' | 'story' {
  try {
    if (new URLSearchParams(window.location.search).has('story')) return 'story';
  } catch {
    // Ignore a malformed URL.
  }
  return hasWebGL() && !isLowEnd() ? 'flight' : 'story';
}
