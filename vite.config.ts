import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The budget is 450 KB gzipped for the initial load; Three.js is a
    // separate chunk that loads only in flight mode.
    chunkSizeWarningLimit: 1000,
  },
});
