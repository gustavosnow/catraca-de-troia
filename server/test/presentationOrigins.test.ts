import assert from 'node:assert/strict';
import test from 'node:test';
import { listPresentationOrigins } from '../presentationAccess';

test('endereço direto de apresentação prioriza Wi-Fi e ignora loopback e interfaces virtuais', () => {
  const origins = listPresentationOrigins(3000, {
    lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    docker0: [{ address: '172.17.0.1', family: 'IPv4', internal: false }],
    enp2s0: [{ address: '192.168.0.20', family: 'IPv4', internal: false }],
    wlp0s20f3: [{ address: '192.168.0.25', family: 'IPv4', internal: false }],
  });

  assert.deepEqual(origins, [
    'http://192.168.0.25:3000',
    'http://192.168.0.20:3000',
    'http://172.17.0.1:3000',
  ]);
});

test('endereço direto descarta IPv6 e endereços autoconfigurados', () => {
  assert.deepEqual(listPresentationOrigins(4173, {
    wlp0: [
      { address: 'fe80::1', family: 'IPv6', internal: false },
      { address: '169.254.10.5', family: 'IPv4', internal: false },
    ],
  }), []);
});

test('QR acompanha a troca de rede sem reiniciar a API', async () => {
  const { createApp } = await import('../app');
  const { createDatabase } = await import('../db');
  const database = createDatabase({ filename: ':memory:' });
  let current = ['http://172.29.190.176:3000'];
  const server = createApp(database, { presentationOrigins: () => current }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as { port: number };
  const read = async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/presentation-access`);
    return ((await response.json()) as { data: { origins: string[] } }).data.origins;
  };
  try {
    assert.deepEqual(await read(), ['http://172.29.190.176:3000']);
    current = ['http://192.168.0.6:3000'];
    assert.deepEqual(await read(), ['http://192.168.0.6:3000']);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    database.close();
  }
});
