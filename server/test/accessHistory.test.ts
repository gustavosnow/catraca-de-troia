import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWeeklyAccessFromLogs } from '../../src/services/demoAccessService';
import type { AbsenceJustification, AccessLog } from '../../src/types';

const baseLog = {
  studentId: 'std-1',
  studentName: 'Ana Clara de Souza Mendes',
  matricula: '2024-0891',
  avatar: '',
  turma: '4º Ano B',
  shift: 'Manhã',
  relativeTime: 'Persistido',
  turnstileId: 'cat-01',
  turnstileName: 'Catraca 01',
  status: 'Autorizado',
  method: 'Facial',
  notification: {
    whatsapp: 'Entregue',
    pushApp: 'Entregue',
    sentAt: '07:00:00',
    phoneTarget: '',
  },
} satisfies Omit<AccessLog, 'id' | 'timestamp' | 'exactTime' | 'direction'>;

test('histórico semanal deriva somente eventos persistidos e justificativas aprovadas', () => {
  const logs: AccessLog[] = [
    { ...baseLog, id: 'entry', timestamp: '2026-10-14T07:00:00', exactTime: '07:00:00', direction: 'entry' },
    { ...baseLog, id: 'exit', timestamp: '2026-10-14T12:00:00', exactTime: '12:00:00', direction: 'exit' },
  ];
  const justifications: AbsenceJustification[] = [{
    id: 'just-1',
    studentId: 'std-1',
    studentName: 'Ana Clara de Souza Mendes',
    date: '2026-10-13',
    reasonCategory: 'Médico / Saúde',
    description: 'Consulta médica.',
    submittedAt: '13/10/2026',
    status: 'Aprovado pela Coordenação',
  }];

  const history = buildWeeklyAccessFromLogs(
    logs,
    'std-1',
    justifications,
    new Date('2026-10-14T12:00:00'),
  );

  assert.equal(history.length, 5);
  assert.equal(history[0].status, 'presente');
  assert.equal(history[0].durationHours, '5h 00min na escola');
  assert.equal(history[1].status, 'ausente_justificado');
  assert.equal(history[2].status, 'sem_registro');
  assert.equal(history[2].entryTime, null);
  assert.equal(history[2].exitTime, null);
});
