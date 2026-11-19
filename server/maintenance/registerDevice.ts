/**
 * Cadastra (ou renova o token de) uma catraca do protótipo facial (MC-036).
 *
 *   npm run device:register -- --id cat-01-entrada --direction ENTRY
 *   npm run device:register -- --id cat-01-saida --direction EXIT --camera http://192.168.0.8:4747/video
 *   npm run device:register -- --id cat-01-entrada --deactivate
 *
 * O token aparece uma única vez; a base guarda apenas o hash.
 */
import { parseArgs } from 'node:util';
import { createDatabase } from '../db';
import { AccessDeviceService } from '../modules/accessDevices/service';

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    name: { type: 'string' },
    'turnstile-id': { type: 'string', default: 'cat-01' },
    'turnstile-name': { type: 'string', default: 'Catraca 01 (Portão Principal)' },
    direction: { type: 'string', default: 'ENTRY' },
    operator: { type: 'string' },
    school: { type: 'string' },
    'min-score': { type: 'string', default: '0.40' },
    camera: { type: 'string' },
    deactivate: { type: 'boolean', default: false },
  },
});

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

if (!values.id) fail('Informe --id (ex.: --id cat-01-entrada).');
const database = createDatabase({ filename: process.env.DATABASE_PATH });

try {
  if (values.deactivate) {
    const result = database.prepare('UPDATE access_devices SET active = 0 WHERE id = ?').run(values.id);
    console.log(result.changes ? `Catraca ${values.id} desativada.` : `Catraca ${values.id} não encontrada.`);
  } else {
    const direction = values.direction?.toUpperCase();
    if (direction !== 'ENTRY' && direction !== 'EXIT') fail('--direction deve ser ENTRY ou EXIT.');
    // Padrões: a escola cadastrada e a primeira conta ativa da Portaria.
    const schoolId = values.school
      ?? (database.prepare('SELECT id FROM schools ORDER BY id LIMIT 1').get() as { id: string } | undefined)?.id
      ?? fail('Nenhuma escola cadastrada. Rode antes: npm run db:seed.');
    const operatorId = values.operator
      ?? (database.prepare(`
        SELECT id FROM users WHERE school_id = ? AND role = 'STAFF_GATE' AND account_status = 'ACTIVE'
        ORDER BY name LIMIT 1
      `).get(schoolId) as { id: string } | undefined)?.id
      ?? fail('Nenhuma conta ativa da Portaria. Informe --operator.');
    const { device, token } = new AccessDeviceService(database).register({
      id: values.id!,
      schoolId,
      name: values.name || (direction === 'ENTRY' ? 'Câmera de entrada' : 'Câmera de saída'),
      turnstileId: values['turnstile-id']!,
      turnstileName: values['turnstile-name']!,
      direction: direction as 'ENTRY' | 'EXIT',
      operatorUserId: operatorId,
      minScore: Number(values['min-score']),
      cameraSource: values.camera,
    });
    console.log(`Catraca ${device.id} cadastrada: ${device.turnstile.name}, ${device.direction === 'ENTRY' ? 'entrada' : 'saída'}, limiar mínimo ${device.minScore}.`);
    console.log(device.cameraSource
      ? `Câmera: ${device.cameraSource}.`
      : 'Câmera ainda não definida: use --camera ou configure pelo painel para iniciar o agente pela API.');
    console.log('');
    console.log('Token do dispositivo (copie agora para edge/.env como DEVICE_TOKEN; ele não será exibido de novo):');
    console.log(token);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : 'Falha ao cadastrar a catraca.');
} finally {
  database.close();
}
