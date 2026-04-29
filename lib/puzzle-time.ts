// Pure date helpers — safe to import from client components.

export function utcDayStart(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function dateKey(date: Date = new Date()): string {
  return utcDayStart(date).toISOString().slice(0, 10);
}

export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tomorrow.getTime() - now.getTime();
}
