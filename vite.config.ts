import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      // GitHub Pages SPA 폴백: /patchnotes 등 직접 접근·새로고침 시 404 → index.html
      name: 'spa-404-fallback',
      closeBundle() {
        const index = path.resolve(__dirname, 'dist/index.html');
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, path.resolve(__dirname, 'dist/404.html'));
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
