import type { AppDatabase } from '../db';
import { AccessDeviceService } from '../modules/accessDevices/service';
import { SCHOOL, STAFF } from './schoolData';

const turnstiles = [
  { id: 'cat-01', name: 'Catraca 01 (Portão Principal)', direction: 'ENTRY', suffix: 'entrada', cameraName: 'Câmera de entrada' },
  { id: 'cat-02', name: 'Catraca 02', direction: 'EXIT', suffix: 'saida', cameraName: 'Câmera de saída' },
] as const;

export const ensureDemoTurnstiles = (database: AppDatabase) => {
  const gate = STAFF.find((member) => member.role === 'STAFF_GATE')!;
  const service = new AccessDeviceService(database);
  const findDevice = database.prepare(`
    SELECT id, turnstile_name, direction FROM access_devices
    WHERE school_id = ? AND turnstile_id = ?
    ORDER BY id
  `);
  const findById = database.prepare('SELECT id FROM access_devices WHERE id = ?');

  return database.transaction(() => {
    const created: string[] = [];
    for (const turnstile of turnstiles) {
      const existing = findDevice.all(SCHOOL.id, turnstile.id) as {
        id: string;
        turnstile_name: string;
        direction: 'ENTRY' | 'EXIT';
      }[];
      if (existing.some((device) => device.direction === turnstile.direction)) continue;
      const id = `${turnstile.id}-${turnstile.suffix}`;
      if (findById.get(id)) throw new Error(`Câmera ${id} já usada em outro cadastro.`);
      service.register({
        id,
        schoolId: SCHOOL.id,
        name: turnstile.cameraName,
        turnstileId: turnstile.id,
        turnstileName: existing[0]?.turnstile_name ?? turnstile.name,
        direction: turnstile.direction,
        operatorUserId: gate.id,
        minScore: 0.4,
      });
      created.push(id);
    }
    return created;
  }).immediate();
};
