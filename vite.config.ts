import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Proxy API requests to the serverless function
        // during local development.
        '/api': {
          target: env.VITE_API_PROXY_URL || 'http://localhost:5173',
          changeOrigin: true,
        },
      },
    },
  };
});
