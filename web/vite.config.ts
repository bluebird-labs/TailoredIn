import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const WEB_PORT = Number(process.env.VITE_PORT ?? 5173);
const API_PORT = Number(process.env.API_PORT ?? 8000);

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: WEB_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        rewrite: p => p.replace(/^\/api/, ''),
        timeout: 120_000
      }
    }
  }
});
