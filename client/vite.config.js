import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// На GitHub Pages сайт живёт по адресу /<repo-name>/, локально — в корне.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
