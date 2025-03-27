import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utils
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

// Get Day Name
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek % 7];
}

// Map day of week number to name
export function mapDayNumberToName(dayOfWeek: number): string {
  switch (dayOfWeek) {
    case 1: return 'Monday';
    case 2: return 'Tuesday';
    case 3: return 'Wednesday';
    case 4: return 'Thursday';
    case 5: return 'Friday';
    default: return '';
  }
}

// Get date for a specific day of week in a given week
export function getDateForWeekDay(startDate: string, dayOffset: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

// Get current week number
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil(diff / oneWeek);
}

// Generate week dates from start date
export function getWeekDates(startDate: string): string[] {
  const dates = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return dates;
}
