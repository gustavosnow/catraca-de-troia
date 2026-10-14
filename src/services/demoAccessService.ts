import { AccessDirection, AccessLog, DayTimelineEvent, WeeklyAccessDay } from '../types';

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
