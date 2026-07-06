import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks for better caching.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Proxy the real API routes to the NestJS api during local dev (no prefix),
    // so same-origin auth cookies (scoped to /auth/refresh) are sent correctly.
    // These paths don't collide with the SPA routes (/app, /login, /register).
    proxy: Object.fromEntries(
      ['/auth', '/monitors', '/alert-channels', '/health', '/docs'].map((path) => [
        path,
        { target: 'http://localhost:3000', changeOrigin: true },
      ]),
    ),
  },
});
