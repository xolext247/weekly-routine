/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DayOfWeek, Category, TimeBlock, CalendarSettings } from './types';
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_ROUTINE_BLOCKS, 
  timeToDecimal, 
  exportPlannerAsPng,
  decimalToTime
} from './utils';
import CalendarGrid from './components/CalendarGrid';
import CategoryManager from './components/CategoryManager';
import BlockModal from './components/BlockModal';
import { 
  Calendar, 
  Palette, 
  Download, 
  Trash2, 
  RotateCcw, 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Clock, 
  Settings2, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Storage keys
const STORAGE_BLOCKS_KEY = 'routine_planner_blocks_v1';
const STORAGE_CATEGORIES_KEY = 'routine_planner_categories_v1';
const STORAGE_SETTINGS_KEY = 'routine_planner_settings_v1';

export default function App() {
  // State variables synchronized with localStorage
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => {
    const stored = localStorage.getItem(STORAGE_BLOCKS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out legacy default routine blocks
        return parsed.filter((bk: any) => !/^(s|n|w|b|dw|l|af|cr|lei)\d+$/.test(bk.id));
      } catch (e) {
        console.error('Failed to parse stored routine blocks');
      }
    }
    return DEFAULT_ROUTINE_BLOCKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored categories');
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [settings, setSettings] = useState<CalendarSettings>(() => {
    const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored calendar settings');
      }
    }
    return {
      showWeekends: true,
      startHour: 7,
      endHour: 22,
      weekStart: 'Monday',
      calendarTitle: 'Weekly Routine & Focus Blocks',
    };
  });

  // Modal active variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Partial<TimeBlock> | null>(null);

  // Sync state to localStorage on modify
  useEffect(() => {
    localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Handle PNG image download
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const handleExportPNG = async () => {
    setIsExporting(true);
    // Give a small warm timeout for styles to re-render in case of any ongoing animations
    setTimeout(async () => {
      try {
        await exportPlannerAsPng('calendar-export-container', settings.calendarTitle);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  // State actions: Add / Edit Block
  const handleSaveBlock = (savedData: Omit<TimeBlock, 'id'> & { id?: string; days?: DayOfWeek[] }) => {
    const targetDays = savedData.days && savedData.days.length > 0 ? savedData.days : [savedData.day];

    if (savedData.id) {
      // Update action: original block is updated to the first selected day
      const primaryDay = targetDays[0];
      setBlocks(prev => {
        const updated = prev.map(bk => {
          if (bk.id === savedData.id) {
            return {
              ...bk,
              title: savedData.title,
              startTime: savedData.startTime,
              endTime: savedData.endTime,
              categoryId: savedData.categoryId,
              notes: savedData.notes,
              day: primaryDay,
            } as TimeBlock;
          }
          return bk;
        });

        // Spawn copy blocks for any other days
        const secondaryDays = targetDays.slice(1);
        const copies: TimeBlock[] = secondaryDays.map((d, index) => ({
          id: `block-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          title: savedData.title,
          startTime: savedData.startTime,
          endTime: savedData.endTime,
          categoryId: savedData.categoryId,
          notes: savedData.notes,
          day: d,
        }));

        return [...updated, ...copies];
      });
    } else {
      // Create action: clone the single data entity and spawn physical entries per selected day
      const newBlocks: TimeBlock[] = targetDays.map((d, index) => ({
        id: `block-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        title: savedData.title,
        startTime: savedData.startTime,
        endTime: savedData.endTime,
        categoryId: savedData.categoryId,
        notes: savedData.notes,
        day: d,
      }));
      setBlocks(prev => [...prev, ...newBlocks]);
    }
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (deleteId: string) => {
    setBlocks(prev => prev.filter(bk => bk.id !== deleteId));
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  // Launch modal filled with clicked slot time info
  const handleAddBlockAtTime = (day: DayOfWeek, clickedHour: number) => {
    const calculatedStart = `${String(clickedHour).padStart(2, '0')}:00`;
    const calculatedEnd = `${String(Math.min(clickedHour + 1, 23)).padStart(2, '0')}:00`;
    
    setEditingBlock({
      day,
      startTime: calculatedStart,
      endTime: calculatedEnd,
    });
    setIsModalOpen(true);
  };

  const handleEditBlock = (blockToEdit: TimeBlock) => {
    setEditingBlock(blockToEdit);
    setIsModalOpen(true);
  };

  // Category state manipulations
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setCategories(prev => [...prev, { ...newCat, id }]);
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const isCategoryUsed = (catId: string) => {
    return blocks.some(bk => bk.categoryId === catId);
  };

  // Wipe routines with quick helpers
  const handleResetToDefaults = () => {
    setBlocks(DEFAULT_ROUTINE_BLOCKS);
    setCategories(DEFAULT_CATEGORIES);
    setSettings({
      showWeekends: true,
      startHour: 7,
      endHour: 22,
      weekStart: 'Monday',
      calendarTitle: 'Weekly Routine & Focus Blocks',
    });
    setShowResetConfirm(false);
  };

  // Calculations: Budget hours
  const budgetCalculations = () => {
    const allocatedHours: Record<string, number> = {};
    
    // Initialize
    categories.forEach(c => {
      allocatedHours[c.id] = 0;
    });

    let totalBudgeted = 0;

    blocks.forEach(bk => {
      const duration = timeToDecimal(bk.endTime) - timeToDecimal(bk.startTime);
      if (duration > 0) {
        if (allocatedHours[bk.categoryId] !== undefined) {
          allocatedHours[bk.categoryId] += duration;
        } else {
          allocatedHours[bk.categoryId] = duration;
        }
        totalBudgeted += duration;
      }
    });

    const activeDaysCount = settings.showWeekends ? 7 : 5;
    const maxAvailableHours = activeDaysCount * 24;

    return {
      allocated: allocatedHours,
      total: totalBudgeted,
      percent: Math.round((totalBudgeted / maxAvailableHours) * 100) || 0,
    };
  };

  const budgetStats = budgetCalculations();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      
      {/* Dynamic Sub-header Navigation Header bar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40" id="main-nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-150">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
                Weekly Time Blocker
                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
                  Local Mode
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                Offline routine constructor • No cloud integrations required
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showResetConfirm ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-1.5 rounded-xl shadow-sm" id="reset-confirm-container">
                <span className="text-[10px] font-bold text-rose-700 px-1.5 uppercase tracking-wider">Reset all?</span>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-2.5 py-1 text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                  id="btn-nav-reset-default-confirm"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-705 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  id="btn-nav-reset-default-cancel"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Reset the grid and categories to blank/default state"
                id="btn-nav-reset-default"
              >
                <RotateCcw size={14} /> Reset Grid
              </button>
            )}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="px-4.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100"
              id="btn-nav-export-png"
            >
              <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
              {isExporting ? 'Generating PNG...' : 'Export Routine as PNG'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Single-Screen workspace container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          
          {/* LEFT PANEL: Settings & Category Architecturing */}
          <div className="space-y-6" id="left-controls-sidebar">
            
            {/* Quick settings card */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-slate-850 text-base flex items-center gap-1.5">
                  <Settings2 size={16} className="text-slate-400" />
                  Grid Settings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize calendar range and labels</p>
              </div>

              {/* Title input setting */}
              <div>
                <label htmlFor="settings-title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Routine Poster Title
                </label>
                <input
                  id="settings-title"
                  type="text"
                  value={settings.calendarTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, calendarTitle: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700"
                  placeholder="e.g., Summer Routine, Project Sprint"
                />
              </div>

              {/* Day settings & Weekend toggler */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Week Start
                  </span>
                  <div className="flex bg-slate-100/50 rounded-lg p-0.5" id="week-start-toggle">
                    {(['Monday', 'Sunday'] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSettings(prev => ({ ...prev, weekStart: option }))}
                        className={`flex-1 text-center py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                          settings.weekStart === option 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {option.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Weekends
                  </span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, showWeekends: !prev.showWeekends }))}
                    className={`w-full py-1 text-[10px] font-bold uppercase tracking-wider border rounded-lg flex items-center justify-center gap-1 transition-all ${
                      settings.showWeekends 
                        ? 'border-indigo-100 bg-indigo-50/40 text-indigo-700 font-extrabold' 
                        : 'border-slate-200 text-slate-400 bg-white'
                    }`}
                  >
                    {settings.showWeekends ? <Eye size={12} /> : <EyeOff size={11} />}
                    {settings.showWeekends ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Active Routine Interval Controller */}
              <div className="pt-2 border-t border-slate-100/60 mt-2 space-y-2.5" id="active-routine-interval-controller">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Active Routine Interval
                </span>
                
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-150 shadow-sm">
                  {/* Digital Badges Indicator */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-1 rounded-md">
                      🌅 Starts: {settings.startHour === 0 ? '12:00 AM' : settings.startHour === 12 ? '12:00 PM' : settings.startHour < 12 ? `${settings.startHour}:00 AM` : `${settings.startHour - 12}:00 PM`}
                    </span>
                    <span className="text-rose-700 bg-rose-50 border border-rose-100/50 px-2 py-1 rounded-md">
                      🌌 Ends: {settings.endHour === 0 ? '12:00 AM' : settings.endHour === 12 ? '12:00 PM' : settings.endHour === 23 ? '11:59 PM' : settings.endHour < 12 ? `${settings.endHour}:00 AM` : `${settings.endHour - 12}:00 PM`}
                    </span>
                  </div>

                  {/* Start time bounds slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                      <span>Start Time Boundaries</span>
                      <span className="font-mono text-slate-600">{settings.startHour}:00</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="22"
                      value={settings.startHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= settings.endHour) {
                          setSettings(prev => ({ 
                            ...prev, 
                            startHour: val, 
                            endHour: Math.min(23, val + 1) 
                          }));
                        } else {
                          setSettings(prev => ({ ...prev, startHour: val }));
                        }
                      }}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer transition-all hover:bg-slate-300"
                    />
                  </div>

                  {/* End time bounds slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                      <span>End Time Boundaries</span>
                      <span className="font-mono text-slate-600">{settings.endHour}:00</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="23"
                      value={settings.endHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val <= settings.startHour) {
                          setSettings(prev => ({ 
                            ...prev, 
                            endHour: val, 
                            startHour: Math.max(0, val - 1) 
                          }));
                        } else {
                          setSettings(prev => ({ ...prev, endHour: val }));
                        }
                      }}
                      className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer transition-all hover:bg-slate-300"
                    />
                  </div>

                  {/* Helpful calculation footer inside sliders tool */}
                  <div className="text-[10px] text-slate-450 text-center font-bold bg-white/70 py-1.5 rounded-lg border border-slate-100 flex items-center justify-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>Display Spans: <b className="text-slate-700">{settings.endHour - settings.startHour + 1} Hours</b> total schedule</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Custom activity Categories management panel */}
            <CategoryManager 
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onResetCategories={() => setCategories(DEFAULT_CATEGORIES)}
              isUsedInBlocks={isCategoryUsed}
            />

            {/* Visual Budget Time Allocation breakdowns panel (Excellent High-Fidelity details) */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4" id="time-budget-container">
              <div>
                <h3 className="font-semibold text-slate-850 text-base flex items-center gap-1.5">
                  <LayoutGrid size={16} className="text-slate-400" />
                  Time Budget
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribution of blocked weekly hours</p>
              </div>

              <div className="space-y-3">
                {/* Total scheduled visual slider indicator */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
                    <span>Active Allocation</span>
                    <span>{budgetStats.total} hrs budgeted</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(budgetStats.percent, 100)}%` }} 
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                    Allocated {budgetStats.percent}% of total week hours
                  </span>
                </div>

                {/* Sub-hours budgeted list by customized color blocks */}
                <div className="border-t border-slate-50 pt-2 space-y-2 mt-2 max-h-[180px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const hrs = budgetStats.allocated[cat.id] || 0;
                    if (hrs === 0) return null; // hide categories with 0 allocated hours for sleek design

                    // Compute individual percent contribution
                    const isTotalGtZero = budgetStats.total > 0;
                    const blockPercent = isTotalGtZero ? Math.round((hrs / budgetStats.total) * 100) : 0;

                    return (
                      <div key={`budget-${cat.id}`} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full inline-block" 
                              style={{ backgroundColor: cat.color }} 
                            />
                            {cat.name}
                          </span>
                          <span className="text-slate-500 font-bold">
                            {hrs} hrs ({blockPercent}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${blockPercent}%`,
                              backgroundColor: cat.color 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(budgetStats.allocated).every(v => v === 0) && (
                    <p className="text-[10px] text-slate-400 italic py-2 text-center">
                      No blocks scheduled yet. Click interactive slots to budget time.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT CANVAS: Interactive Weekly Routine Spreadsheet Grid */}
          <div className="space-y-4" id="main-calendar-canvas">
            
            {/* Quick Helper Banner */}
            <div className="bg-gradient-to-r from-indigo-50/50 to-pink-50/20 p-4 rounded-xl border border-indigo-100/30 flex items-start gap-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0 animate-bounce">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-tight">
                  Design Your Ideal Week Schedule
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">
                  • <strong>Click anywhere inside columns</strong> or hover empty slots to block out time segments. <br />
                  • Click existing blocks to edit name, timing details, notes, or delete them. <br />
                  • Click <strong>Export Routine as PNG</strong> to save a beautiful weekly schedule poster to your directory!
                </p>
              </div>
            </div>

            <CalendarGrid 
              blocks={blocks}
              categories={categories}
              settings={settings}
              onEditBlock={handleEditBlock}
              onAddBlockAtTime={handleAddBlockAtTime}
            />
          </div>

        </div>
      </div>

      {/* FOOTER credit brand line */}
      <footer className="mt-20 border-t border-slate-100/50 py-6 text-center">
        <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
          WEEKLY ROUTINE PLANNER & TIME BLOCK UTILITY • DECLASSIFIED OFFLINE SECURITY
        </p>
      </footer>

      {/* Standard popup modal selector */}
      <BlockModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBlock(null);
        }}
        onSave={handleSaveBlock}
        onDelete={editingBlock?.id ? handleDeleteBlock : undefined}
        categories={categories}
        existingBlocks={blocks}
        initialBlock={editingBlock}
      />
    </div>
  );
}
