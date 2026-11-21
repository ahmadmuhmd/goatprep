/** Daily question helpers. Day index cycles through 365 stored questions per section. */
export const DAILY_EPOCH = Date.UTC(2026, 0, 1);

export function dayIndex(date: string) {
 const t = Date.parse(date + 'T00:00:00Z');
 if (!Number.isFinite(t)) throw new Error('Invalid date.');
 return ((Math.floor((t - DAILY_EPOCH) / 86400000) % 365) + 365) % 365;
}

/** Accept the student's local date, but only within a day of server time (time zones). */
export function validDate(date: unknown): string {
 if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date.');
 const diff = Math.abs(Date.parse(date + 'T12:00:00Z') - Date.now());
 if (diff > 36 * 3600000) throw new Error('Only today’s questions are available.');
 return date;
}

export function dailyStats(rows: {day: string; correct: boolean}[]) {
 const days = [...new Set(rows.map(r => String(r.day).slice(0, 10)))].sort().reverse();
 let streak = 0;
 if (days.length) {
  const set = new Set(days);
  const cursor = new Date(); cursor.setUTCHours(12, 0, 0, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (!set.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (set.has(iso(cursor))) {streak++; cursor.setUTCDate(cursor.getUTCDate() - 1);}
 }
 return {streak, answered: rows.length, correct: rows.filter(r => r.correct).length, days: days.slice(0, 60)};
}
