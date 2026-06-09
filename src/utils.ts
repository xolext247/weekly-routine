/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toPng } from 'html-to-image';
import { Category, TimeBlock } from './types';

// Convert "HH:MM" (e.g. "08:30") to decimal hours (8.5)
export function timeToDecimal(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours + minutes / 60;
}

// Convert decimal hours (e.g. 8.5) to "HH:MM" (08:30)
export function decimalToTime(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  // Ensure we round correctly to stop double digits
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
}

// Format "HH:MM" 24h format to nice 12h representation (e.g. "08:30" => "8:30 AM", "14:00" => "2:00 PM")
export function formatTime12h(timeStr: string): string {
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  if (isNaN(hours)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

// Custom export selector that converts the calendar DOM node directly to a downloaded PNG image
export async function exportPlannerAsPng(elementId: string, title: string = 'My Weekly Routine') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Could not find element to export');
  }

  // Define some styles specifically for download if needed
  try {
    // Run html-to-image to transform target element into a neat high-res visual PNG
    const dataUrl = await toPng(element, {
      quality: 0.98,
      backgroundColor: '#fcfcfd', // Soft neutral background for the exported template file
      cacheBust: true,
      style: {
        // Enforce smooth high-resolution layouts during capture
        borderRadius: '0px',
      },
    });

    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-h0-9_-]/g, '_') || 'routine_planner';
    const downloadLink = document.createElement('a');
    downloadLink.download = `${sanitizedTitle}.png`;
    downloadLink.href = dataUrl;
    downloadLink.click();
  } catch (error) {
    console.error('Error generating screenshot of routine plan:', error);
    alert('Oops! Standard canvas generation had an issue. Please try exporting again or inspect console for details.');
  }
}

// Default Categories for Routine Building
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work & Study', color: '#3b82f6', textColor: '#ffffff' }, // Vibrant Blue
  { id: 'cat-health', name: 'Exercise & Health', color: '#10b981', textColor: '#ffffff' }, // Emerald Green
  { id: 'cat-sleep', name: 'Sleep & Wind Down', color: '#6366f1', textColor: '#ffffff' }, // Indigo
  { id: 'cat-meal', name: 'Meals & Prep', color: '#f59e0b', textColor: '#ffffff' }, // Amber Yellow
  { id: 'cat-leisure', name: 'Rest & Leisure', color: '#ec4899', textColor: '#ffffff' }, // Hot Pink
  { id: 'cat-creative', name: 'Creative Projects', color: '#8b5cf6', textColor: '#ffffff' } // Purple
];

// Rich, Beautiful Pre-filled routine to avoid a blank visual board
export const DEFAULT_ROUTINE_BLOCKS: TimeBlock[] = [];

/**
 * Checks if a proposed block overlaps with any existing block of the SAME DAY.
 * Excludes checking against itself when updating.
 */
export function checkOverlaps(
  newBlock: Omit<TimeBlock, 'id'> & { id?: string },
  blocks: TimeBlock[]
): { hasConflict: boolean; conflictingBlock?: TimeBlock } {
  const newStart = timeToDecimal(newBlock.startTime);
  const newEnd = timeToDecimal(newBlock.endTime);
  
  if (newStart >= newEnd) {
    return { hasConflict: true };
  }

  const dayBlocks = blocks.filter(b => b.day === newBlock.day && b.id !== newBlock.id);

  for (const block of dayBlocks) {
    const blockStart = timeToDecimal(block.startTime);
    const blockEnd = timeToDecimal(block.endTime);

    // Overlap checks: (newStart < blockEnd) && (newEnd > blockStart)
    if (newStart < blockEnd && newEnd > blockStart) {
      return { hasConflict: true, conflictingBlock: block };
    }
  }

  return { hasConflict: false };
}
