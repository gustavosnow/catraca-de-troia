/** Fuso da escola; define onde começa o dia letivo para a sequência de passagens. */
export const SCHOOL_TIME_ZONE = process.env.SCHOOL_TIME_ZONE || 'America/Sao_Paulo';

/** Início (meia-noite local) do dia letivo que contém `timestamp`, em ISO UTC. */
export const schoolDayStart = (timestamp: string, timeZone = SCHOOL_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  // "GMT-03:00" → "-03:00"; "GMT" (UTC) → "Z".
  const offset = part('timeZoneName')?.replace('GMT', '') || 'Z';
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00${offset}`).toISOString();
};
