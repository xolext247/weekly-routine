/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg-style hex/color or raw CSS hex color (we'll support direct hex colors for customization)
  textColor: string; // matching text color
}

export interface TimeBlock {
  id: string;
  title: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" in 24h format
  endTime: string;   // "HH:MM" in 24h format
  categoryId: string;
  notes?: string;
}

export interface CalendarSettings {
  showWeekends: boolean;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  weekStart: 'Sunday' | 'Monday';
  calendarTitle: string;
}
