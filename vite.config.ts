import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Site statique : tout est servi depuis dist/, les données et les icônes depuis public/.
export default defineConfig({
  plugins: [react()],
  base: './',
});
