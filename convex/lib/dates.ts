export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function addDaysISO(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dateRange(from: string, to: string) {
  const dates: string[] = [];
  let cursor = from;
  let guard = 0;
  while (cursor < to && guard < 60) {
    dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function isValidISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
