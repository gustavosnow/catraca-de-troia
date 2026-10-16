import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {createReadStream, statSync} from 'node:fs';
import path from 'path';
import {defineConfig, type Plugin, type ViteDevServer} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const deviceApkName = 'catraca-de-troia-responsaveis-device-debug.apk';

const developmentServiceWorkerCleanupPlugin = (): Plugin => ({
  name: 'catraca-development-service-worker-cleanup',
  configureServer: (server) => {
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0] !== '/sw.js') {
        next();
        return;
      }

      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.setHeader('Service-Worker-Allowed', '/');
      response.end(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.includes('workbox') || name.includes('precache'))
      .map((name) => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
`);
    });
  },
});

const apkDownloadPlugin = (): Plugin => {
  const serveApk = (middlewares: ViteDevServer['middlewares']) => {
    middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0] !== `/${deviceApkName}`) {
        next();
        return;
      }
      const apkPath = path.resolve('public', deviceApkName);
      try {
        const stats = statSync(apkPath);
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/vnd.android.package-archive');
        response.setHeader('Content-Disposition', `attachment; filename="${deviceApkName}"`);
        response.setHeader('Content-Length', stats.size);
        response.setHeader('Cache-Control', 'no-store');
        if (request.method === 'HEAD') response.end();
        else createReadStream(apkPath).pipe(response);
      } catch {
        next();
      }
    });
  };

  return {
    name: 'catraca-apk-download',
    configureServer: (server) => serveApk(server.middlewares),
    configurePreviewServer: (server) => serveApk(server.middlewares),
  };
};

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      apkDownloadPlugin(),
      developmentServiceWorkerCleanupPlugin(),
      VitePWA({
        injectRegister: null,
        registerType: 'autoUpdate',
        includeAssets: ['pwa-192.png', 'pwa-512.png', 'logo-catraca-troia.png'],
        manifest: {
          id: '/#/responsaveis',
          name: 'Catraca de Troia — Responsáveis',
          short_name: 'Catraca de Troia',
          description: 'Acompanhamento demonstrativo de acesso escolar para responsáveis.',
          lang: 'pt-BR',
          start_url: '/#/responsaveis',
          scope: '/',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'portrait-primary',
          background_color: '#020617',
          theme_color: '#0f172a',
          categories: ['education', 'utilities'],
          shortcuts: [
            {
              name: 'Portal dos responsáveis',
              short_name: 'Responsáveis',
              url: '/#/responsaveis',
              icons: [{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react';
            if (id.includes('/motion/')) return 'vendor-motion';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (id.includes('/qrcode.react/') || id.includes('/qrcode-generator/')) return 'vendor-qrcode';
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
  };
});
