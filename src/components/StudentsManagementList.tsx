import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, CircleDashed, PauseCircle, Search, ShieldCheck } from 'lucide-react';
import type { Shift, Student } from '../types';
import { TURMAS_LIST } from '../data/mockData';
import { EmptySearchIllustration } from './brand/Illustrations';
import { Avatar, Callout, Chip, EmptyState, PageHeader, withoutRelation } from './ui';

interface StudentsManagementListProps {
  students: Student[];
  onSelectStudent: (studentId: string) => void;
}

const StudentStatus: React.FC<{ status: Student['status'] }> = ({ status }) => {
  if (status === 'Ativo') return <Chip tone="positive" icon={CheckCircle2}>Ativo</Chip>;
  if (status === 'Afastado') return <Chip tone="warning" icon={PauseCircle}>Afastado</Chip>;
  return <Chip tone="neutral" icon={CircleDashed}>{status}</Chip>;
};

export const StudentsManagementList: React.FC<StudentsManagementListProps> = ({ students, onSelectStudent }) => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<'Todos' | 'Fundamental I' | 'Fundamental II'>('Todos');
  const [turma, setTurma] = useState('Todas');
  const [shift, setShift] = useState<Shift>('Todos');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return students.filter((student) => {
      const matchesTerm = !term || [student.name, student.matricula, student.guardianName, student.homeroomTeacher ?? '']
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      return matchesTerm
        && (stage === 'Todos' || student.stage === stage)
        && (turma === 'Todas' || student.turma === turma)
        && (shift === 'Todos' || student.shift === shift);
    });
  }, [search, shift, stage, students, turma]);

  const hasFilters = Boolean(search) || stage !== 'Todos' || turma !== 'Todas' || shift !== 'Todos';
  const clearFilters = () => {
    setSearch('');
    setStage('Todos');
    setTurma('Todas');
    setShift('Todos');
  };

  return (
    <>
      <PageHeader
        eyebrow="Gestão escolar"
        title="Estudantes"
        description="Informações essenciais para acolher, identificar e acompanhar."
        actions={<Chip tone="neutral" icon={ShieldCheck}>Consulta cadastral</Chip>}
      />

      <section className="card overflow-hidden" aria-labelledby="students-title">
        <div className="card-header">
          <div>
            <h2 id="students-title" className="card-title">
              Estudantes da escola <span className="font-normal text-muted">/ {students.length}</span>
            </h2>
            <p className="card-subtitle">O piloto não oferece matrícula, edição ou exclusão de estudantes.</p>
          </div>
        </div>

        <div className="grid gap-3 px-6 pb-5 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,170px))]">
          <div className="relative">
            <label htmlFor="students-search" className="sr-only">Buscar estudantes</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="students-search"
              type="search"
              className="input pl-9"
              placeholder="Nome, matrícula ou responsável"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="students-stage" className="sr-only">Ciclo</label>
            <select id="students-stage" className="select" value={stage} onChange={(event) => setStage(event.target.value as typeof stage)}>
              <option value="Todos">Todos os ciclos</option>
              <option value="Fundamental I">Fundamental I</option>
              <option value="Fundamental II">Fundamental II</option>
            </select>
          </div>
          <div>
            <label htmlFor="students-turma" className="sr-only">Turma</label>
            <select id="students-turma" className="select" value={turma} onChange={(event) => setTurma(event.target.value)}>
              {TURMAS_LIST.map((item) => (
                <option key={item} value={item}>{item === 'Todas' ? 'Todas as turmas' : item.split(' - ')[0]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="students-shift" className="sr-only">Turno</label>
            <select id="students-shift" className="select" value={shift} onChange={(event) => setShift(event.target.value as Shift)}>
              <option value="Todos">Todos os turnos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Integral">Integral</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            illustration={<EmptySearchIllustration className="mb-4 h-20" />}
            title="Nenhum resultado"
            description="Ajuste os filtros para continuar."
            action={<button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Limpar filtros</button>}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table min-w-[900px]">
              <caption className="sr-only">Estudantes cadastrados na unidade</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Estudante / matrícula</th>
                  <th scope="col">Turma / ciclo</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Responsável</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="pr-6 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} />
                        <div className="min-w-0">
                          <p className="cell-primary">{student.name}</p>
                          <p className="cell-secondary num">{student.matricula}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="whitespace-nowrap">{student.turma.split(' - ')[0]}</p>
                      <p className="cell-secondary">{student.stage ?? student.turma.split(' - ')[1]}</p>
                    </td>
                    <td>{student.shift}</td>
                    <td>
                      <p>{withoutRelation(student.guardianName)}</p>
                      <p className="cell-secondary">{student.guardianRelation}</p>
                    </td>
                    <td><StudentStatus status={student.status} /></td>
                    <td className="pr-6 text-right">
                      <button type="button" className="btn-link" onClick={() => onSelectStudent(student.id)} aria-label={`Ver ficha de ${student.name}`}>
                        <ArrowUpRight aria-hidden="true" />
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span>{filtered.length} de {students.length} estudantes · Dados fictícios</span>
          {hasFilters && <button type="button" className="btn-link" onClick={clearFilters}>Limpar filtros</button>}
        </div>
      </section>

      <Callout tone="neutral" icon={ShieldCheck} className="mt-5">
        A situação cadastral não deve ser interpretada como autorização para bloquear fisicamente a entrada de um estudante.
      </Callout>
    </>
  );
};
