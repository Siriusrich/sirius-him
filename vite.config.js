import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (name) => fileURLToPath(new URL(`./src/${name}.html`, import.meta.url));

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: 'public',
  appType: 'mpa',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        home: page('index'),
        music: page('music'),
        about: page('about'),
        videos: page('videos'),
        connect: page('connect'),
        admin: page('admin/index'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
});
