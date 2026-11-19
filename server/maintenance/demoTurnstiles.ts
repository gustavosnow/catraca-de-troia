import type { AppDatabase } from '../db';
import { AccessDeviceService } from '../modules/accessDevices/service';
import { SCHOOL, STAFF } from './schoolData';

const turnstiles = [
  { id: 'cat-01', name: 'Catraca 01 (Portão Principal)' },
  { id: 'cat-02', name: 'Catraca 02' },
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
      for (const [direction, suffix, name] of [
        ['ENTRY', 'entrada', 'Câmera de entrada'],
        ['EXIT', 'saida', 'Câmera de saída'],
      ] as const) {
        if (existing.some((device) => device.direction === direction)) continue;
        const id = `${turnstile.id}-${suffix}`;
        if (findById.get(id)) throw new Error(`Câmera ${id} já usada em outro cadastro.`);
        service.register({
          id,
          schoolId: SCHOOL.id,
          name,
          turnstileId: turnstile.id,
          turnstileName: existing[0]?.turnstile_name ?? turnstile.name,
          direction,
          operatorUserId: gate.id,
          minScore: 0.4,
        });
        created.push(id);
      }
    }
    return created;
  }).immediate();
};
