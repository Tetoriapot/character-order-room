import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));
const pagesPath = process.env.PAGES_BASE_PATH?.replace(/^\/+|\/+$/g, '') ?? '';

// A separate static entry keeps the existing Sites/Cloudflare build unchanged.
export default defineConfig({
  root: fileURLToPath(new URL('./github-pages', import.meta.url)),
  base: pagesPath ? `/${pagesPath}/` : '/',
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  resolve: { alias: { '@': projectRoot } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    react(),
    {
      name: 'pages-static-files',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: readFileSync(new URL('./app/robots.txt', import.meta.url), 'utf8'),
        });
      },
    },
  ],
  build: {
    outDir: fileURLToPath(new URL('./dist-pages', import.meta.url)),
    emptyOutDir: true,
  },
});
