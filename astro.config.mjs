import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // Add the vite configuration below
  vite: {
    server: {
      watch: {
        usePolling: true,
      }
    }
  }
});