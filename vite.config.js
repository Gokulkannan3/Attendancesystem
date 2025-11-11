// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],

  // ----  THIS LINE STOPS THE PARSE ERROR  ----
  assetsInclude: ['**/*.bin'],

  // (optional but safe)
  server: {
    fs: { allow: ['..'] },
  },

  build: {
    assetsInclude: ['**/*.bin'],
  },
});