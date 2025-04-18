import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Use MDX Rollup plugin for MDX support
import mdx from '@mdx-js/rollup';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // First transform MDX, then React JSX
    mdx({
      // Use MDX provider from @mdx-js/react for JSX processing
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
    }),
    react(),
  ],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 3000
  }
});