/// <reference types="vite/client" />

declare module 'virtual:photos' {
  /** File names in public/photos at build time. */
  const photos: string[];
  export default photos;
}

declare module 'virtual:audio' {
  /** File names in public/audio at build time. */
  const audio: string[];
  export default audio;
}
