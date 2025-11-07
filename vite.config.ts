import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDevelopmentBuild = process.env.DEV_BUILD === 'true';

    console.log('Building with DEV_BUILD:', isDevelopmentBuild);

    return {
      base: '/somerepo/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Don't minify if development build
        minify: isDevelopmentBuild ? false : 'esbuild',
        // Source maps for debugging
        sourcemap: isDevelopmentBuild ? true : false,
      }
    };
});
