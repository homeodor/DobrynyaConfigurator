import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import autoPreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirnameX = dirname(fileURLToPath(import.meta.url));

const production = !process.env.ROLLUP_WATCH;

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build:
  {
    outDir: "electron/dist"
  },
  server: { https: true },
  output: {
  //      sourcemap: true, // <-- remove
          sourcemap: !production // ,
          // format: 'iife',
          // name: 'app',
          // file: 'public/build/bundle.js'
    },
  plugins: [
    mkcert(),
    svelte({
      preprocess: autoPreprocess(),
      compilerOptions: {
        dev: !production
//        customElement: true
      }
    }),
    typescript({
      sourceMap: !production,
      inlineSources: !production
    })]
})
