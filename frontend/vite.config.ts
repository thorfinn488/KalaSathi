import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/demo-api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/static': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
