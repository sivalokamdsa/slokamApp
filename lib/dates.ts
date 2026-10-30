// Dates are stored as local "YYYY-MM-DD" strings so a date never shifts
// by a day because of timezones.

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

// Returns the last `count` dates ending today, oldest first.
export function lastNDays(count: number): string[] {
  const today = todayString();
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));
}

// Current streak: consecutive days, ending today (or yesterday, so an
// unfinished today doesn't break it), that have at least one active day.
export function currentStreak(activeDays: Set<string>): number {
  let cursor = todayString();
  if (!activeDays.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
