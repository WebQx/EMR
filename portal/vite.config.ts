import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'src'),
    build: {
      outDir: path.resolve(__dirname, '../public/portal'),
      emptyOutDir: true,
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
