// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // <--- Ensure this is EXACTLY 5173
    https: true, // <--- Ensure this is EXACTLY true
  },
});