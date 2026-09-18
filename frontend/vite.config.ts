import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'skogsbyran-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const icons = ['skogsbyranIcon.png', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png', 'apple-touch-icon.png'];
      const assets = Object.keys(bundle).filter(path => path.startsWith('assets/')).sort();
      const template = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8');
      const hash = createHash('sha256').update(template);
      for (const path of assets) {
        const output = bundle[path];
        hash.update(path).update(output.type === 'chunk' ? output.code : output.source);
      }
      for (const icon of icons) hash.update(readFileSync(new URL(`./public/icon/${icon}`, import.meta.url)));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template
        .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 16))
        .replace('__STATIC_ASSETS__', JSON.stringify([...assets.map(path => `/${path}`), ...icons.map(icon => `/icon/${icon}`)])) });
    },
  }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
