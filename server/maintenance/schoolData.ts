import type {
  ExitAuthorization,
  StudentShift,
  StudentStage,
} from '../../shared/contracts/students';
import type { GuardianRelationship } from '../../shared/contracts/linkRequests';

/**
 * Carga inicial da escola (MC-039). Pessoas cadastradas para a apresentação do
 * projeto: nenhum estudante corresponde a uma criança real, o que mantém a
 * regra de biometria (só adultos da equipe, ligados a estudantes de teste).
 */
export const SCHOOL = {
  id: 'escola-catraca-troia',
  name: 'Escola Municipal Catraca de Troia',
  emailDomain: 'catracadetroia.edu.br',
};

export interface StaffSeed {
  id: string;
  name: string;
  role: 'STAFF_GATE' | 'STAFF_COORDINATION' | 'STAFF_DIRECTION';
  email: string;
  phone: string;
  functionalRegistry: string;
}

export interface GuardianSeed {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: GuardianRelationship;
}

export interface StudentSeed {
  id: string;
  name: string;
  enrollment: string;
  className: string;
  shift: StudentShift;
  stage: StudentStage;
  homeroomTeacher: string;
  birthDate: string;
  exitAuthorization: ExitAuthorization;
  guardianId: string;
}

const email = (local: string) => `${local}@${SCHOOL.emailDomain}`;

export const STAFF: StaffSeed[] = [
  {
    id: 'equipe-gustavo-coelho',
    name: 'Gustavo Coelho',
    role: 'STAFF_COORDINATION',
    email: email('gustavo.coelho'),
    phone: '(11) 90000-1001',
    functionalRegistry: 'MAT-2026/0101',
  },
  {
    id: 'equipe-hanrry-junior',
    name: 'Hanrry Junior',
    role: 'STAFF_GATE',
    email: email('hanrry.junior'),
    phone: '(11) 90000-1002',
    functionalRegistry: 'MAT-2026/0102',
  },
];

export const GUARDIANS: GuardianSeed[] = [
  { id: 'resp-saylon-batista', name: 'Saylon Batista', email: email('saylon.batista'), phone: '(11) 90000-2001', relationship: 'Pai' },
  { id: 'resp-fernanda-ribeiro', name: 'Fernanda Ribeiro', email: email('fernanda.ribeiro'), phone: '(11) 90000-2002', relationship: 'Mãe' },
  { id: 'resp-marcos-almeida', name: 'Marcos Almeida', email: email('marcos.almeida'), phone: '(11) 90000-2003', relationship: 'Pai' },
  { id: 'resp-patricia-nunes', name: 'Patrícia Nunes', email: email('patricia.nunes'), phone: '(11) 90000-2004', relationship: 'Mãe' },
  { id: 'resp-roberto-teixeira', name: 'Roberto Teixeira', email: email('roberto.teixeira'), phone: '(11) 90000-2005', relationship: 'Avó / Avô' },
  { id: 'resp-juliana-moraes', name: 'Juliana Moraes', email: email('juliana.moraes'), phone: '(11) 90000-2006', relationship: 'Mãe' },
];

export const STUDENTS: StudentSeed[] = [
  // Saylon Batista: três estudantes.
  { id: 'est-livia-batista', name: 'Lívia Batista', enrollment: '2026-0001', className: '2º Ano A', shift: 'MORNING', stage: 'EARLY_YEARS', homeroomTeacher: 'Profª. Renata Lopes', birthDate: '2018-04-12', exitAuthorization: 'GUARDIAN_ONLY', guardianId: 'resp-saylon-batista' },
  { id: 'est-davi-batista', name: 'Davi Batista', enrollment: '2026-0002', className: '5º Ano A', shift: 'MORNING', stage: 'EARLY_YEARS', homeroomTeacher: 'Prof. André Souza', birthDate: '2015-09-03', exitAuthorization: 'GUARDIAN_ONLY', guardianId: 'resp-saylon-batista' },
  { id: 'est-helena-batista', name: 'Helena Batista', enrollment: '2026-0003', className: '8º Ano B', shift: 'AFTERNOON', stage: 'FINAL_YEARS', homeroomTeacher: 'Profª. Camila Duarte', birthDate: '2012-11-21', exitAuthorization: 'UNACCOMPANIED', guardianId: 'resp-saylon-batista' },
  // Fernanda Ribeiro: dois estudantes.
  { id: 'est-pedro-ribeiro', name: 'Pedro Ribeiro', enrollment: '2026-0004', className: '3º Ano B', shift: 'MORNING', stage: 'EARLY_YEARS', homeroomTeacher: 'Profª. Renata Lopes', birthDate: '2017-06-30', exitAuthorization: 'SCHOOL_TRANSPORT', guardianId: 'resp-fernanda-ribeiro' },
  { id: 'est-clara-ribeiro', name: 'Clara Ribeiro', enrollment: '2026-0005', className: '6º Ano A', shift: 'AFTERNOON', stage: 'FINAL_YEARS', homeroomTeacher: 'Prof. Thiago Martins', birthDate: '2014-02-14', exitAuthorization: 'SCHOOL_TRANSPORT', guardianId: 'resp-fernanda-ribeiro' },
  { id: 'est-miguel-almeida', name: 'Miguel Almeida', enrollment: '2026-0006', className: '4º Ano A', shift: 'MORNING', stage: 'EARLY_YEARS', homeroomTeacher: 'Prof. André Souza', birthDate: '2016-08-09', exitAuthorization: 'GUARDIAN_ONLY', guardianId: 'resp-marcos-almeida' },
  { id: 'est-laura-nunes', name: 'Laura Nunes', enrollment: '2026-0007', className: '7º Ano A', shift: 'AFTERNOON', stage: 'FINAL_YEARS', homeroomTeacher: 'Profª. Camila Duarte', birthDate: '2013-05-17', exitAuthorization: 'UNACCOMPANIED', guardianId: 'resp-patricia-nunes' },
  { id: 'est-bernardo-teixeira', name: 'Bernardo Teixeira', enrollment: '2026-0008', className: '1º Ano A', shift: 'FULL_TIME', stage: 'EARLY_YEARS', homeroomTeacher: 'Profª. Beatriz Campos', birthDate: '2019-01-25', exitAuthorization: 'GUARDIAN_ONLY', guardianId: 'resp-roberto-teixeira' },
  // Juliana Moraes: dois estudantes.
  { id: 'est-alice-moraes', name: 'Alice Moraes', enrollment: '2026-0009', className: '9º Ano A', shift: 'AFTERNOON', stage: 'FINAL_YEARS', homeroomTeacher: 'Prof. Thiago Martins', birthDate: '2011-10-02', exitAuthorization: 'UNACCOMPANIED', guardianId: 'resp-juliana-moraes' },
  { id: 'est-rafael-moraes', name: 'Rafael Moraes', enrollment: '2026-0010', className: '3º Ano A', shift: 'FULL_TIME', stage: 'EARLY_YEARS', homeroomTeacher: 'Profª. Beatriz Campos', birthDate: '2017-03-18', exitAuthorization: 'GUARDIAN_ONLY', guardianId: 'resp-juliana-moraes' },
];
