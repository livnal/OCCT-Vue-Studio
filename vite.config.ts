import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration for the Vue 3 application.
// This file defines the development server port and plugins used during build.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173
  }
});
