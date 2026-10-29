import assert from 'node:assert/strict';
import test from 'node:test';
import { getPresentationAccess } from '../../src/utils/presentationAccess';

test('QR de apresentação rejeita loopback, protocolos inválidos e URLs com credenciais', () => {
  for (const input of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000', 'http://0.0.0.0:3000', 'javascript:alert(1)', 'https://user:password@demo.example', 'sem-protocolo']) {
    const result = getPresentationAccess(input);
    assert(result.error, input); assert.equal(result.url, undefined);
  }
});

test('QR abre somente a rota dos responsáveis sem parâmetros de sessão', () => {
  assert.deepEqual(getPresentationAccess('https://demo.example/base/?token=ficticio#/escola'), {
    url: 'https://demo.example/base/#/responsaveis', localNetwork: false,
  });
  assert.deepEqual(getPresentationAccess('http://192.168.0.25:3000/#/apresentacao'), {
    url: 'http://192.168.0.25:3000/#/responsaveis', localNetwork: true,
  });
});
