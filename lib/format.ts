const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(cents: number, precise = false) {
  const value = (cents ?? 0) / 100;
  return precise ? usdPrecise.format(value) : usd.format(value);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateShort(iso: string) {
  return formatDate(iso, { year: undefined });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
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

export function relativeTime(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
