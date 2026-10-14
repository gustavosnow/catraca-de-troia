import { AbsenceJustification, AccessDirection, AccessLog, DayTimelineEvent, WeeklyAccessDay } from '../types';

export const getStudentAccessLogs = (logs: AccessLog[], studentId: string) =>
  logs
    .filter((log) => log.studentId === studentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

export const getNextAccessDirection = (
  logs: AccessLog[],
  studentId: string,
): AccessDirection => {
  const studentLogs = getStudentAccessLogs(logs, studentId);
  return studentLogs.at(-1)?.direction === 'entry' ? 'exit' : 'entry';
};

export const buildStudentAccessTimeline = (
  logs: AccessLog[],
  studentId: string,
): DayTimelineEvent[] =>
  getStudentAccessLogs(logs, studentId)
    .slice(-8)
    .map((log) => ({
      id: `timeline-${log.id}`,
      time: log.exactTime.slice(0, 5),
      title: `${log.direction === 'entry' ? 'Entrada' : 'Saída'} registrada`,
      location: log.turnstileName,
      status: 'completed',
      badgeType: log.direction,
      detail: `${log.method} • ${log.status}${log.operator ? ` • Operador: ${log.operator}` : ''}`,
    }));

const durationBetween = (entryTime: string, exitTime: string) => {
  const toSeconds = (value: string) => {
    const [hours, minutes, seconds = 0] = value.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const seconds = Math.max(0, toSeconds(exitTime) - toSeconds(entryTime));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}min na escola`;
};

export const mergeSessionLogsIntoWeeklyAccess = (
  days: WeeklyAccessDay[],
  logs: AccessLog[],
  studentId: string,
): WeeklyAccessDay[] => {
  const studentLogs = getStudentAccessLogs(logs, studentId);
  if (studentLogs.length === 0 || days.length === 0) return days;

  const firstEntry = studentLogs.find((log) => log.direction === 'entry');
  const lastExit = [...studentLogs].reverse().find((log) => log.direction === 'exit');
  if (!firstEntry && !lastExit) return days;

  const currentDay = days[0];
  const entryTime = firstEntry?.exactTime ?? null;
  const exitTime = lastExit?.exactTime ?? null;
  const referenceLog = lastExit || firstEntry;

  return [
    {
      ...currentDay,
      entryTime,
      exitTime,
      turnstileUsed: referenceLog?.turnstileName ?? currentDay.turnstileUsed,
      method: referenceLog?.method ?? currentDay.method,
      status: exitTime ? 'presente' : 'em_andamento',
      durationHours:
        entryTime && exitTime
          ? durationBetween(entryTime, exitTime)
          : entryTime
            ? 'Em andamento (eventos da sessão demonstrativa)'
            : 'Saída sem entrada correspondente na sessão demonstrativa',
      notificationDelivered: referenceLog?.notification.pushApp === 'Entregue',
    },
    ...days.slice(1),
  ];
};

const localDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

export const buildWeeklyAccessFromLogs = (
  logs: AccessLog[],
  studentId: string,
  justifications: AbsenceJustification[] = [],
  referenceDate = new Date(),
): WeeklyAccessDay[] => {
  const dates: Date[] = [];
  const cursor = new Date(referenceDate);
  cursor.setHours(12, 0, 0, 0);
  while (dates.length < 5) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  const studentLogs = getStudentAccessLogs(logs, studentId);
  return dates.map((date, index) => {
    const key = localDateKey(date);
    const dayLogs = studentLogs.filter((log) => localDateKey(new Date(log.timestamp)) === key);
    const entries = dayLogs.filter((log) => log.direction === 'entry');
    const exits = dayLogs.filter((log) => log.direction === 'exit');
    const entry = entries[0];
    const exit = exits.at(-1);
    const reference = exit || entry;
    const justification = justifications.find((item) =>
      item.studentId === studentId
      && item.status === 'Aprovado pela Coordenação'
      && key >= item.date
      && key <= (item.endDate || item.date),
    );

    let status: WeeklyAccessDay['status'] = 'sem_registro';
    let durationHours = 'Sem eventos persistidos';
    if (entry && exit) {
      status = 'presente';
      durationHours = durationBetween(entry.exactTime, exit.exactTime);
    } else if (entry) {
      status = 'em_andamento';
      durationHours = 'Entrada registrada; saída ainda não registrada';
    } else if (exit) {
      status = 'em_andamento';
      durationHours = 'Saída registrada sem entrada correspondente';
    } else if (justification) {
      status = 'ausente_justificado';
      durationHours = `Ausência justificada: ${justification.reasonCategory}`;
    }

    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
      .format(date)
      .replace('.', '');
    return {
      dayName: index === 0 ? `Hoje (${weekday})` : weekday,
      shortDate: `${String(date.getDate()).padStart(2, '0')}/${new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(date)
        .replace('.', '')}`,
      fullDate: new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      }).format(date),
      entryTime: entry?.exactTime || null,
      exitTime: exit?.exactTime || null,
      turnstileUsed: reference?.turnstileName || 'Sem evento',
      method: reference?.method || '-',
      status,
      durationHours,
      notificationDelivered: reference?.notification.pushApp === 'Entregue',
    };
  });
};
