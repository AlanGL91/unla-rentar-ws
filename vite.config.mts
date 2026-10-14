import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

// Strict CSP only in the build: the dev server needs an inline script for React Refresh.
function strictCsp(): Plugin {
  return {
    name: 'strict-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: PROD_CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

// `base: './'` so the built index.html loads assets over file:// in Electron.
export default defineConfig({
  base: './',
  plugins: [react(), strictCsp()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
