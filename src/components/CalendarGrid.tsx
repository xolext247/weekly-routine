/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DayOfWeek, Category, TimeBlock, CalendarSettings } from '../types';
import { timeToDecimal, formatTime12h, decimalToTime } from '../utils';
import { EyeOff, AlertCircle, FileText, Plus } from 'lucide-react';

interface CalendarGridProps {
  blocks: TimeBlock[];
  categories: Category[];
  settings: CalendarSettings;
  onEditBlock: (block: TimeBlock) => void;
  onAddBlockAtTime: (day: DayOfWeek, hour: number) => void;
}

const HOUR_HEIGHT = 56; // Pixels per hour

export default function CalendarGrid({
  blocks,
  categories,
  settings,
  onEditBlock,
  onAddBlockAtTime,
}: CalendarGridProps) {
  const { startHour, endHour, showWeekends, weekStart } = settings;
  const hoursArray = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Determine standard day order
  const getDays = (): DayOfWeek[] => {
    let days: DayOfWeek[] = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    if (weekStart === 'Sunday') {
      days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    if (!showWeekends) {
      days = days.filter(d => d !== 'Saturday' && d !== 'Sunday');
    }
    return days;
  };

  const activeDays = getDays();

  // Compute color styles: falls back if a category was deleted
  const getBlockStyle = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      return {
        backgroundColor: '#94a3b8',
        borderColor: '#64748b',
        textColor: '#ffffff',
      };
    }
    return {
      backgroundColor: category.color,
      borderColor: category.color,
      textColor: category.textColor || '#ffffff',
    };
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-250 shadow-md overflow-hidden flex flex-col"
      id="calendar-export-container"
    >
      {/* Calendar Header inside PNG card */}
      <div className="p-6 bg-white border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850 tracking-tight" id="export-calendar-title">
            {settings.calendarTitle || "My Weekly Time Block"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Visual routine planner • Generated on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Legendary Key Indicator of category colors */}
        <div className="flex flex-wrap gap-2.5 max-w-full">
          {categories.slice(0, 12).map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-md shadow-sm transition-all hover:shadow-md">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-[10px] font-bold text-slate-600 tracking-tight">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col select-none p-6 pt-3 overflow-x-auto" style={{ minWidth: '800px' }}>
        {/* Days Header Column labels */}
        <div className="grid grid-cols-[80px_1fr] border border-zinc-800 bg-zinc-950 shrink-0 rounded-t-xl overflow-hidden shadow-sm">
          {/* Time Column Placeholder spacer */}
          <div className="border-r border-zinc-800 py-3 text-[10px] font-extrabold text-zinc-400 text-center uppercase tracking-widest flex items-center justify-center bg-zinc-900/80">
            Time
          </div>
          
          {/* Calendar Day Labels */}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${activeDays.length}, minmax(0, 1fr))` }}>
            {activeDays.map((day) => {
              const isWeekend = day === 'Saturday' || day === 'Sunday';
              return (
                <div 
                  key={day} 
                  className={`text-center py-2.5 border-r border-zinc-800 last:border-r-0 transition-colors ${
                    isWeekend ? 'bg-zinc-900/60 text-amber-300' : 'bg-zinc-950 text-zinc-100'
                  }`}
                >
                  <span className="text-xs font-bold tracking-tight uppercase block leading-tight">
                    {day.substring(0, 3)}
                  </span>
                  <span className="text-[9px] tracking-wider text-zinc-400 font-semibold uppercase">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Main Grid Area */}
        <div className="grid grid-cols-[80px_1fr] relative border-x border-b border-slate-300 bg-white rounded-b-xl overflow-hidden shadow-sm">
          
          {/* Time Column Labels on Left side */}
          <div className="border-r border-zinc-800 bg-zinc-950 flex flex-col">
            {hoursArray.map((hour, index) => {
              const formatted = formatTime12h(`${String(hour).padStart(2, '0')}:00`);
              return (
                <div 
                  key={hour} 
                  className="text-right text-[10px] font-bold text-zinc-400 flex items-start justify-end pr-2.5 border-b border-zinc-900/40 last:border-b-0"
                  style={{ 
                    height: `${HOUR_HEIGHT}px`,
                    paddingTop: '8px' // align with gridlines
                  }}
                >
                  {formatted}
                </div>
              );
            })}
          </div>

          {/* Grid Inner Cells Columns */}
          <div className="relative bg-slate-50/10">
            {/* Grid Horizontal Background Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {hoursArray.map((hour, index) => (
                <div 
                  key={hour} 
                  className={`border-t border-slate-300 w-full`}
                  style={{ 
                    height: `${HOUR_HEIGHT}px`,
                    top: `${index * HOUR_HEIGHT}px`,
                    borderStyle: hour === 12 ? 'dashed' : 'solid' // Noon dashes
                  }}
                >
                  {hour === 12 && (
                    <span className="absolute right-2 text-[8px] font-bold uppercase text-slate-400 tracking-wider pt-1 select-none">
                      NOON INTERVAL
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical grid lines separating each Day Column */}
            <div 
              className="absolute inset-0 grid pointer-events-none"
              style={{ gridTemplateColumns: `repeat(${activeDays.length}, minmax(0, 1fr))` }}
            >
              {activeDays.map((day, idx) => (
                <div 
                  key={`line-${day}`} 
                  className={`h-full border-r border-slate-300 ${
                    idx === activeDays.length - 1 ? 'border-r-0' : ''
                  }`} 
                />
              ))}
            </div>

            {/* Actual Daily Column contents containing visual block structures */}
            <div 
              className="grid relative"
              style={{ 
                gridTemplateColumns: `repeat(${activeDays.length}, minmax(0, 1fr))`,
                height: `${(hoursArray.length - 1) * HOUR_HEIGHT + HOUR_HEIGHT}px`
              }}
            >
              {activeDays.map((day) => {
                // Fetch blocks that belong to this specific Day
                const dayBlocks = blocks.filter(b => b.day === day);

                return (
                  <div key={`col-${day}`} className="relative h-full w-full group">
                    {/* Empty Slots Clickable helper items for interactive routine creation */}
                    <div className="absolute inset-0 pointer-events-none group-hover:pointer-events-auto">
                      {hoursArray.slice(0, -1).map((hour) => (
                        <button
                          key={`empty-${day}-${hour}`}
                          type="button"
                          onClick={() => onAddBlockAtTime(day, hour)}
                          className="absolute w-full hover:bg-indigo-50/20 text-indigo-500 opacity-0 hover:opacity-100 flex items-center justify-center gap-1 cursor-pointer transition-all border border-dashed border-indigo-200 bg-white/70"
                          style={{
                            top: `${(hour - startHour) * HOUR_HEIGHT}px`,
                            height: `${HOUR_HEIGHT}px`,
                          }}
                          title={`Schedule activity on ${day} at ${hour}:00`}
                        >
                          <Plus size={13} className="animate-pulse" />
                          <span className="text-[9px] font-extrabold uppercase tracking-widest">
                            Add Block
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Paint all scheduled activity time-blocks in this Day Column */}
                    {dayBlocks.map((block) => {
                      const startDec = timeToDecimal(block.startTime);
                      const endDec = timeToDecimal(block.endTime);

                      // Filter/Bound check: clip elements that are out of bounds of displayed slots
                      const displayStart = Math.max(startDec, startHour);
                      const displayEnd = Math.min(endDec, endHour + 1);

                      if (displayStart >= displayEnd) return null;

                      // Exact style layout calculations
                      const topPx = (displayStart - startHour) * HOUR_HEIGHT;
                      const heightPx = (displayEnd - displayStart) * HOUR_HEIGHT;

                      const { backgroundColor, borderColor, textColor } = getBlockStyle(block.categoryId);

                      // Let's decide if block is tiny to shrink contents gracefully
                      const isTinyBlock = heightPx < 45;

                      return (
                        <div
                          key={block.id}
                          onClick={() => onEditBlock(block)}
                          className="absolute left-1 right-1 rounded-md border-l-4 p-2.5 overflow-hidden cursor-pointer hover:translate-x-0.5 active:scale-[0.98] transition-all flex flex-col justify-between"
                          style={{
                            top: `${topPx + 2}px`,
                            height: `${heightPx - 4}px`,
                            backgroundColor: `${backgroundColor}1a`, // semi-transparent accent background
                            borderLeftColor: borderColor,
                            borderTopColor: `${borderColor}22`,
                            borderRightColor: `${borderColor}22`,
                            borderBottomColor: `${borderColor}22`,
                            borderWidth: '1px',
                            borderLeftWidth: '4px',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            outline: `1px solid ${borderColor}22`,
                            outlineOffset: '-1px'
                          }}
                          title={`[${block.startTime} - ${block.endTime}] ${block.title} ${block.notes ? `\nNotes: ${block.notes}` : ''}`}
                        >
                          <div>
                            {/* Header styling containing Title info */}
                            <div className="flex items-start justify-between gap-1 leading-tight">
                              <h4 
                                className="font-extrabold text-slate-800 tracking-tight text-left break-words" 
                                style={{ fontSize: isTinyBlock ? '10px' : '11px', color: borderColor }}
                              >
                                {block.title}
                              </h4>
                              {block.notes && !isTinyBlock && (
                                <FileText size={10} className="opacity-60 flex-shrink-0" style={{ color: borderColor }} title="Contains notes" />
                              )}
                            </div>

                            {/* Spacing adjustments based on duration dimensions */}
                            {!isTinyBlock && (
                              <p className="text-[9px] font-bold opacity-85 mt-0.5 flex items-center" style={{ color: borderColor }}>
                                {formatTime12h(block.startTime)} - {formatTime12h(block.endTime)}
                              </p>
                            )}
                          </div>

                          {/* Render bottom notes helper if block size is generous */}
                          {block.notes && heightPx > 70 && (
                            <p className="text-[9px] text-slate-500 italic line-clamp-1 border-t border-slate-200/40 pt-1 mt-1 text-left bg-white/10 px-1 rounded">
                              {block.notes}
                            </p>
                          )}

                          {isTinyBlock && (
                            <span className="text-[9px] font-bold block leading-none" style={{ color: borderColor }}>
                              {block.startTime}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>


    </div>
  );
}
