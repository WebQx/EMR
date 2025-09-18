import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    // Use relative base so the portal works under /webqx/portal/ on GitHub Pages
    base: './',
    plugins: [react()],
    root: path.resolve(__dirname, 'src'),
    build: {
      // Output inside portal/dist so CI workflow's copy step (portal/dist) finds it
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
      assetsDir: 'assets',
    },
    server: {
      port: 5173,
      proxy: {
        '/health': 'http://localhost:3000',
        '/internal': 'http://localhost:3000',
        '/api': 'http://localhost:3000',
        '/fhir': 'http://localhost:3000'
      }
    }
  };
});
