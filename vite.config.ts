import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { intro } from './src/content/story';

// Optional files Mihir adds later. Each folder is listed at build time as a
// virtual module, so a missing photo or sound makes no request at all.
const FOLDERS = {
  'virtual:photos': { dir: resolve(import.meta.dirname, 'public/photos'), pattern: /\.(webp|jpe?g|png|avif)$/i },
  'virtual:audio': { dir: resolve(import.meta.dirname, 'public/audio'), pattern: /\.(mp3|ogg|m4a|webm)$/i },
};
type FolderId = keyof typeof FOLDERS;
const isFolder = (id: string): id is FolderId => id in FOLDERS;

function optionalFiles(): Plugin {
  const list = (id: FolderId) => {
    try {
      return readdirSync(FOLDERS[id].dir).filter((f) => FOLDERS[id].pattern.test(f));
    } catch {
      return [];
    }
  };
  return {
    name: 'optional-files',
    resolveId: (id) => (isFolder(id) ? `\0${id}` : undefined),
    load: (id) => {
      const name = id.slice(1);
      return id.startsWith('\0') && isFolder(name) ? `export default ${JSON.stringify(list(name))};` : undefined;
    },
    configureServer(server) {
      // Adding or removing a file in dev reloads the lists.
      const dirs = Object.values(FOLDERS).map((f) => f.dir);
      server.watcher.add(dirs);
      const refresh = (file: string) => {
        if (!dirs.some((d) => file.startsWith(d))) return;
        for (const id of Object.keys(FOLDERS)) {
          const mod = server.moduleGraph.getModuleById(`\0${id}`);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Writes the opening title into index.html, from story.ts, so it paints
 * before any script runs. React takes over the same markup once it starts.
 * Story mode (?story) removes it at once.
 */
function openingShell(): Plugin {
  const shell = `
    <section id="shell" class="intro is-visible" aria-hidden="true">
      <p class="intro__festival"><span lang="gu" class="gujarati">${escape(intro.gujarati)}</span><span class="intro__latin">${escape(intro.gujaratiLatin)}</span></p>
      <h1 class="intro__title">${escape(intro.heroTitle)}</h1>
      <p class="intro__subtitle">${escape(intro.heroSubtitle)}</p>
      <div class="intro__actions"><p class="intro__loading">${escape(intro.loader)}</p></div>
    </section>
    <script>if (/[?&]story(=|&|$)/.test(location.search)) document.getElementById('shell').remove();</script>`;
  return {
    name: 'opening-shell',
    transformIndexHtml: (html) => html.replace('<div id="root"></div>', `<div id="root"></div>${shell}`),
  };
}

export default defineConfig({
  plugins: [react(), optionalFiles(), openingShell()],
  build: {
    // The budget is 450 KB gzipped for the initial load; Three.js is a
    // separate chunk that loads only in flight mode.
    chunkSizeWarningLimit: 1000,
  },
});
