import { resolve } from 'path';
import { defineConfig } from 'vite';

/** Must match the GitHub repo name when using project Pages (user.github.io/repo-name/). */
const base = process.env.VITE_BASE_PATH || '/theeke-defense/';

export default defineConfig({
  base,
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
  server: {
    open: base,
  },
});
