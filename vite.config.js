import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH supports publishing to https://username.github.io/repository-name/
// Example: BASE_PATH=/my-journal/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
});
