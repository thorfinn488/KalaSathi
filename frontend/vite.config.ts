import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        ...(env.VITE_ENABLE_ORDER_API === 'true' ? {
          '/demo-api': {
            target: 'http://127.0.0.1:8001',
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/demo-api/, ''),
          },
        } : {}),
        '/static': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
