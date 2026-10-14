import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        injectRegister: null,
        registerType: 'prompt',
        includeAssets: ['pwa-192.png', 'pwa-512.png', 'logo-catraca-troia.png'],
        manifest: {
          id: '/#/responsaveis',
          name: 'Catraca de Tróia — Responsáveis',
          short_name: 'Catraca de Tróia',
          description: 'Acompanhamento demonstrativo de acesso escolar para responsáveis.',
          lang: 'pt-BR',
          start_url: '/#/responsaveis',
          scope: '/',
          display: 'standalone',
          background_color: '#020617',
          theme_color: '#0f172a',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
    preview: {
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
  };
});
