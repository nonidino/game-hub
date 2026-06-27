import { RELATIONSHIP_START, MONTHEVERSARY_DAY } from "./config";

export interface TogetherBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalSeconds: number;
}

/** Calendar-accurate breakdown of time elapsed since the start date. */
export function togetherBreakdown(
  now: Date,
  start: Date = RELATIONSHIP_START
): TogetherBreakdown {
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    // borrow the number of days in the month preceding `now`
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  const ms = now.getTime() - start.getTime();
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays: Math.floor(ms / 86_400_000),
    totalHours: Math.floor(ms / 3_600_000),
    totalSeconds: Math.floor(ms / 1000),
  };
}

/** How many montheversaries (15ths) have been completed since the start. Oct 15 2024 => 0. */
export function completedMontheversaries(
  now: Date,
  start: Date = RELATIONSHIP_START
): number {
  let n =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < MONTHEVERSARY_DAY) n--;
  return Math.max(0, n);
}

/** Break a count of months into { years, months }. */
export function yearsAndMonths(totalMonths: number): {
  years: number;
  months: number;
} {
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

/** Human label like "1 year, 11 months" or "2 years" or "5 months". */
export function yearsMonthsLabel(totalMonths: number): string {
  const { years, months } = yearsAndMonths(totalMonths);
  const parts: string[] = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (months) parts.push(`${months} month${months === 1 ? "" : "s"}`);
  if (parts.length === 0) return "brand new ✨";
  return parts.join(", ");
}

/** The next upcoming 15th at local midnight, strictly after `now`. */
export function nextMontheversaryDate(now: Date): Date {
  let d = new Date(now.getFullYear(), now.getMonth(), MONTHEVERSARY_DAY, 0, 0, 0, 0);
  if (d.getTime() <= now.getTime()) {
    d = new Date(now.getFullYear(), now.getMonth() + 1, MONTHEVERSARY_DAY, 0, 0, 0, 0);
  }
  return d;
}

export function isMontheversaryToday(now: Date): boolean {
  return now.getDate() === MONTHEVERSARY_DAY;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownTo(target: Date, now: Date): Countdown {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSec / 86_400),
    hours: Math.floor((totalSec % 86_400) / 3_600),
    minutes: Math.floor((totalSec % 3_600) / 60),
    seconds: totalSec % 60,
    totalMs,
  };
}
