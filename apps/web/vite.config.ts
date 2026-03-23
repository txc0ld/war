import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const siteUrl =
    env.VITE_SITE_URL?.trim() || 'https://the-warroom.vercel.app';

  return {
    plugins: [
      react(),
      {
        name: 'war-room-html-env',
        transformIndexHtml(html) {
          return html.replace(/__SITE_URL__/g, siteUrl);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/wagmi/') ||
                id.includes('/viem/') ||
                id.includes('/@walletconnect/') ||
                id.includes('/@coinbase/') ||
                id.includes('/@metamask/')
              ) {
                return 'wallet-vendor';
              }

              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/react-router-dom/') ||
                id.includes('/@tanstack/react-query/')
              ) {
                return 'react-vendor';
              }

              if (
                id.includes('/d3-geo/') ||
                id.includes('/topojson-client/') ||
                id.includes('/world-atlas/')
              ) {
                return 'map-vendor';
              }

              if (id.includes('/framer-motion/')) {
                return 'motion-vendor';
              }
            }

            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
    },
  };
});
