import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  site: 'https://physicurl.pplx.app',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [react()],
  vite: {
    resolve: {
      alias: { '@': '/src' },
    },
  },
});
