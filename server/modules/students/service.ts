import type { DemoActor } from '../../../shared/contracts/justifications';
import type { StudentRecord } from '../../../shared/contracts/students';
import type { AppDatabase } from '../../db';
import { forbidden } from '../../errors';

interface StudentRow {
  id: string;
  name: string;
  enrollment: string;
  class_name: string | null;
  shift: StudentRecord['shift'] | null;
  stage: StudentRecord['stage'] | null;
  homeroom_teacher: string | null;
  birth_date: string | null;
  exit_authorization: StudentRecord['exitAuthorization'] | null;
  emergency_contact: string | null;
  status: StudentRecord['status'];
}

interface GuardianRow {
  student_id: string;
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
}

const studentColumns = `
  s.id, s.name, s.enrollment, s.class_name, s.shift, s.stage, s.homeroom_teacher,
  s.birth_date, s.exit_authorization, s.emergency_contact, s.status
`;

/** Fichas de estudantes. O escopo vem sempre da sessão, nunca de filtro do cliente. */
export class StudentService {
  constructor(private readonly database: AppDatabase) {}

  /** Painel escolar: todos os estudantes da unidade da sessão. */
  listForSchool(actor: DemoActor): StudentRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden('Somente a equipe escolar consulta a lista de estudantes.');
    const rows = this.database.prepare(`
      SELECT ${studentColumns} FROM students s WHERE s.school_id = ? ORDER BY s.name
    `).all(actor.schoolId) as StudentRow[];
    const guardians = this.database.prepare(`
      SELECT link.student_id, u.id, u.name, link.relationship, u.phone
      FROM guardian_student_links link
      JOIN users u ON u.id = link.guardian_user_id
      JOIN students s ON s.id = link.student_id
      WHERE link.status = 'APPROVED' AND s.school_id = ?
      ORDER BY link.approved_at, u.name
    `).all(actor.schoolId) as GuardianRow[];
    return this.map(rows, guardians);
  }

  /**
   * Estudantes acessíveis pela sessão: responsável vê só os vínculos aprovados
   * (e apenas o próprio vínculo); equipe escolar vê a unidade inteira.
   */
  listForActor(actor: DemoActor): StudentRecord[] {
    if (actor.role !== 'GUARDIAN') return this.listForSchool(actor);
    const rows = this.database.prepare(`
      SELECT ${studentColumns}
      FROM students s
      JOIN guardian_student_links link ON link.student_id = s.id
      WHERE link.guardian_user_id = ? AND link.status = 'APPROVED' AND s.school_id = ?
      ORDER BY s.name
    `).all(actor.id, actor.schoolId) as StudentRow[];
    const guardians = this.database.prepare(`
      SELECT link.student_id, u.id, u.name, link.relationship, u.phone
      FROM guardian_student_links link
      JOIN users u ON u.id = link.guardian_user_id
      WHERE link.guardian_user_id = ? AND link.status = 'APPROVED'
    `).all(actor.id) as GuardianRow[];
    return this.map(rows, guardians);
  }

  private map(rows: StudentRow[], guardians: GuardianRow[]): StudentRecord[] {
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      enrollment: row.enrollment,
      className: row.class_name ?? undefined,
      shift: row.shift ?? undefined,
      stage: row.stage ?? undefined,
      homeroomTeacher: row.homeroom_teacher ?? undefined,
      birthDate: row.birth_date ?? undefined,
      exitAuthorization: row.exit_authorization ?? undefined,
      emergencyContact: row.emergency_contact ?? undefined,
      status: row.status,
      guardians: guardians
        .filter((guardian) => guardian.student_id === row.id)
        .map((guardian) => ({
          id: guardian.id,
          name: guardian.name,
          relationship: guardian.relationship ?? undefined,
          phone: guardian.phone ?? undefined,
        })),
    }));
  }
}
