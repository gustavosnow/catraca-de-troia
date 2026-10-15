import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {createReadStream, statSync} from 'node:fs';
import path from 'path';
import {defineConfig, type Plugin, type ViteDevServer} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const deviceApkName = 'catraca-de-troia-responsaveis-device-debug.apk';

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
