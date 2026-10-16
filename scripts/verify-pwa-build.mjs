import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
const serviceWorker = readFileSync('dist/sw.js', 'utf8');

assert.equal(manifest.start_url, '/#/responsaveis');
assert.equal(manifest.scope, '/');
assert.ok(['standalone', 'window-controls-overlay'].includes(manifest.display));
assert.match(serviceWorker, /denylist:\[\/\^\\\/api/);

for (const forbidden of ['.sqlite', '/api/v1/', 'access_events', 'guardian_student_links']) {
  assert.equal(
    serviceWorker.includes(forbidden),
    false,
    `O service worker não deve armazenar ${forbidden}.`,
  );
}

console.log('PWA verificada: shell estático em modo standalone e rotas /api fora do cache de navegação.');
