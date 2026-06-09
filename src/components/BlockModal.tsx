/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DayOfWeek, Category, TimeBlock } from '../types';
import { checkOverlaps, timeToDecimal, decimalToTime } from '../utils';
import { X, Trash2, AlertTriangle, Clock } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, 'id'> & { id?: string; days?: DayOfWeek[] }) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  existingBlocks: TimeBlock[];
  initialBlock?: Partial<TimeBlock> | null;
}

const DAYS_OPTIONS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function BlockModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  existingBlocks,
  initialBlock,
}: BlockModalProps) {
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Conflict state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Load initial values if updating or when clicked from empty slot
  useEffect(() => {
    if (isOpen) {
      setTitle(initialBlock?.title || '');
      setSelectedDays(initialBlock?.day ? [initialBlock.day] : ['Monday']);
      setStartTime(initialBlock?.startTime || '09:00');
      setEndTime(initialBlock?.endTime || '10:00');
      setNotes(initialBlock?.notes || '');
      setShowDeleteConfirm(false);
      
      // Auto-select first category if not provided
      if (initialBlock?.categoryId) {
        setCategoryId(initialBlock.categoryId);
      } else if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [isOpen, initialBlock, categories]);

  // Check for overlaps when day, start, or end changes
  useEffect(() => {
    if (!isOpen || !startTime || !endTime || !categoryId || selectedDays.length === 0) {
      setConflictWarning(null);
      return;
    }

    const startDec = timeToDecimal(startTime);
    const endDec = timeToDecimal(endTime);

    if (startDec >= endDec) {
      setConflictWarning('Start time must be strictly earlier than end time');
      return;
    }

    let firstConflict: string | null = null;
    for (const d of selectedDays) {
      const overlapResult = checkOverlaps(
        {
          id: initialBlock?.id,
          title,
          day: d,
          startTime,
          endTime,
          categoryId,
          notes,
        },
        existingBlocks
      );

      if (overlapResult.hasConflict && overlapResult.conflictingBlock) {
        firstConflict = `Overlap detected on ${d} with existing routine block: "${overlapResult.conflictingBlock.title}" (${overlapResult.conflictingBlock.startTime} - ${overlapResult.conflictingBlock.endTime})`;
        break;
      }
    }

    setConflictWarning(firstConflict);
  }, [selectedDays, startTime, endTime, title, categoryId, existingBlocks, initialBlock, isOpen]);

  if (!isOpen) return null;

  // Shortcut durations helper
  const applyShortcutDuration = (minutes: number) => {
    if (!startTime) return;
    const startDec = timeToDecimal(startTime);
    const endDec = startDec + minutes / 60;
    if (endDec <= 24) {
      setEndTime(decimalToTime(endDec));
    } else {
      setEndTime('23:59');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime || !categoryId || selectedDays.length === 0) return;

    if (timeToDecimal(startTime) >= timeToDecimal(endTime)) {
      alert('Error: Clock start time must be before end time.');
      return;
    }

    onSave({
      id: initialBlock?.id,
      title: title.trim(),
      day: selectedDays[0],
      startTime,
      endTime,
      categoryId,
      notes: notes.trim() || undefined,
      days: selectedDays,
    });
  };

  const selectedCategoryData = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="block-modal-overlay">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div 
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-md border border-slate-100"
          id="block-modal-inner"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: selectedCategoryData?.color || '#cbd5e1' }}
              />
              {initialBlock?.id ? 'Edit Routine Block' : 'Schedule New Block'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              id="btn-close-modal"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="evt-title" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Block Title
              </label>
              <input
                id="evt-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                placeholder="e.g., Deep Work, Core Cardio, Client Sync"
              />
            </div>

            {/* Category Style and Multiple Days select block */}
            <div className="space-y-4">
              <div>
                <label htmlFor="evt-category" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category Style
                </label>
                <select
                  id="evt-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" id="day-selector-label">
                  Apply to Days (Select Multiple)
                </label>
                <div className="grid grid-cols-7 gap-1.5" id="day-selector-container">
                  {DAYS_OPTIONS.map((d) => {
                    const isChecked = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        id={`day-select-${d.toLowerCase()}`}
                        onClick={() => {
                          setSelectedDays((prev) => {
                            if (prev.includes(d)) {
                              // Keep at least one day selected
                              if (prev.length === 1) return prev;
                              return prev.filter((item) => item !== d);
                            } else {
                              return [...prev, d];
                            }
                          });
                        }}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          isChecked
                            ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm font-extrabold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                        title={`Toggle ${d}`}
                      >
                        {d.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="evt-start" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  id="evt-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label htmlFor="evt-end" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  End Time
                </label>
                <input
                  id="evt-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Quick Durations shortcut helper block */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50 flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                <Clock size={11} /> Auto Duration
              </span>
              <div className="flex gap-1">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => applyShortcutDuration(mins)}
                    className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-150 rounded-md transition-all shadow-sm"
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlap / Formatting Warnings */}
            {conflictWarning && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-amber-800 text-xs">
                <AlertTriangle size={15} className="mt-0.5 text-amber-600 flex-shrink-0" />
                <span>
                  {conflictWarning}
                </span>
              </div>
            )}

            {/* Description/Notes */}
            <div>
              <label htmlFor="evt-notes" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Comments / Notes
              </label>
              <textarea
                id="evt-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white resize-none"
                placeholder="e.g. Focus on deep studying, bring water bottle"
              />
            </div>

            {/* Actions group */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {initialBlock?.id && onDelete ? (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-pulse">
                    <span className="text-[10px] font-bold text-rose-700 pl-1">Confirm?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(initialBlock.id!)}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                      id="btn-delete-block"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      id="btn-cancel-delete-block"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    id="btn-delete-block"
                  >
                    <Trash2 size={14} /> Delete Block
                  </button>
                )
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                  id="btn-cancel-modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={conflictWarning !== null && conflictWarning.includes('earlier')}
                  className="px-4.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-xl shadow-md cursor-pointer-not-disabled transition-colors"
                  id="btn-save-block"
                >
                  {initialBlock?.id ? 'Save Changes' : 'Schedule Block'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
