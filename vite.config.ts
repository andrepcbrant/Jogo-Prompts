import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relativo: o build funciona em qualquer subcaminho (GitHub Pages, Vercel, pasta local).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
