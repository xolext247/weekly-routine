/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Trash2, Edit2, RotateCcw, Check, X } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onResetCategories: () => void;
  isUsedInBlocks: (categoryId: string) => boolean;
}

const PRESET_PALETTES = [
  // Red
  { color: '#ef4444', textColor: '#ffffff', label: 'Coral Red' },
  { color: '#f43f5e', textColor: '#ffffff', label: 'Rose Gold' },
  { color: '#ff007f', textColor: '#ffffff', label: 'Neon Rose' },
  // Orange
  { color: '#f97316', textColor: '#ffffff', label: 'Tangerine Orange' },
  { color: '#f59e0b', textColor: '#ffffff', label: 'Amber Orange' },
  // Yellow
  { color: '#eab308', textColor: '#ffffff', label: 'Bright Mustard' },
  // Green
  { color: '#84cc16', textColor: '#ffffff', label: 'Lime Burst' },
  { color: '#16a34a', textColor: '#ffffff', label: 'Classic Green' },
  { color: '#10b981', textColor: '#ffffff', label: 'Emerald Green' },
  { color: '#064e3b', textColor: '#ffffff', label: 'Deep Forest' },
  // Blue / Teal / Cyan
  { color: '#14b8a6', textColor: '#ffffff', label: 'Teal Mint' },
  { color: '#06b6d4', textColor: '#ffffff', label: 'Cyan Teal' },
  { color: '#0891b2', textColor: '#ffffff', label: 'Pacific Lagoon' },
  { color: '#3b82f6', textColor: '#ffffff', label: 'Vibrant Blue' },
  { color: '#1e3a8a', textColor: '#ffffff', label: 'Royal Navy' },
  // Indigo
  { color: '#6366f1', textColor: '#ffffff', label: 'Indigo Night' },
  // Violet / Purple / Magenta
  { color: '#7c3aed', textColor: '#ffffff', label: 'Purple Violet' },
  { color: '#8b5cf6', textColor: '#ffffff', label: 'Classic Purple' },
  { color: '#a855f7', textColor: '#ffffff', label: 'Bright Orchid' },
  { color: '#d946ef', textColor: '#ffffff', label: 'Fuchsia Glow' },
  { color: '#ec4899', textColor: '#ffffff', label: 'Hot Pink' },
  // Neutrals / Dark
  { color: '#78716c', textColor: '#ffffff', label: 'Stone Gray' },
  { color: '#475569', textColor: '#ffffff', label: 'Slate Gray' },
  { color: '#111827', textColor: '#ffffff', label: 'Midnight Jet' },
];

export default function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories,
  isUsedInBlocks,
}: CategoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_PALETTES[0].color);

  // States for editing
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      color: selectedColor,
      textColor: '#ffffff',
    });

    setName('');
    setIsAdding(false);
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateCategory({
      id,
      name: editName.trim(),
      color: editColor,
      textColor: '#ffffff',
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm" id="category-manager-container">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-base">Activity Categories</h3>
          <p className="text-xs text-slate-400 mt-0.5">Customize colors and activity tags</p>
        </div>
        <button
          onClick={() => onResetCategories()}
          title="Reset to Default Palettes"
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
          id="btn-reset-categories"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;
          const isCategoryLocked = isUsedInBlocks(cat.id);

          return (
            <div
              key={cat.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                isEditing ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
              }`}
              id={`cat-row-${cat.id}`}
            >
              {isEditing ? (
                <div className="flex-1 space-y-2 mr-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                    placeholder="Category name"
                    autoFocus
                    id={`input-edit-cat-${cat.id}`}
                  />
                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto p-1 bg-slate-100/50 rounded border border-slate-200">
                    {PRESET_PALETTES.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setEditColor(preset.color)}
                        className={`w-4 h-4 rounded-full transition-all ${
                          editColor === preset.color
                            ? 'ring-2 ring-slate-850 ring-offset-1 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                        id={`palette-edit-${preset.color.replace('#', '')}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Custom Pick:</span>
                    <div className="relative w-6 h-6 rounded border border-slate-300 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                        id={`input-edit-hex-custom-color-${cat.id}`}
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: editColor }}
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={7}
                      value={editColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') && val.length <= 7) {
                          setEditColor(val);
                        } else if (!val.startsWith('#') && val.length <= 6) {
                          setEditColor(`#${val}`);
                        }
                      }}
                      className="w-20 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white uppercase"
                      placeholder="#000000"
                      id={`input-edit-hex-text-color-${cat.id}`}
                    />
                  </div>
                  <div className="flex gap-1.5 justify-end mt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-[10px] font-medium text-slate-500 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                      id={`btn-cancel-edit-cat-${cat.id}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(cat.id)}
                      className="px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                      id={`btn-save-edit-cat-${cat.id}`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/5 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-bold text-slate-700 truncate">{cat.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono italic select-all ml-1 bg-slate-100 px-1 py-0.5 rounded">{cat.color}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(cat)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit Category Name & Color"
                      id={`btn-edit-cat-${cat.id}`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (isCategoryLocked) {
                          alert(`This category is currently being used in your routine blocks. Please reassign or delete those blocks before removing the category.`);
                        } else {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className={`p-1 rounded transition-colors ${
                        isCategoryLocked
                          ? 'text-slate-200 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isCategoryLocked ? "Cannot delete: currently in use" : "Delete Category"}
                      id={`btn-del-cat-${cat.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!isAdding ? (
        <button
          onClick={() => {
            setIsAdding(true);
            setSelectedColor(PRESET_PALETTES[Math.floor(Math.random() * PRESET_PALETTES.length)].color);
          }}
          className="mt-3.5 w-full py-2 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg flex items-center justify-center gap-1.5 text-xs text-indigo-600 bg-slate-50/50 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
          id="btn-trigger-add-category"
        >
          <Plus size={14} /> Add Custom Category
        </button>
      ) : (
        <form onSubmit={handleCreate} className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3" id="form-add-category">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700">New Category</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
              id="btn-close-cat-form"
            >
              <X size={14} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Coding, Commute, Choir"
              required
              id="input-new-cat-name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pick Swatch Color
            </label>
            <div className="grid grid-cols-8 gap-1 max-h-[85px] overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
              {PRESET_PALETTES.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setSelectedColor(preset.color)}
                  className={`h-5 w-full rounded-md border border-black/5 transition-all cursor-pointer ${
                    selectedColor === preset.color
                      ? 'ring-2 ring-indigo-650 ring-offset-1 scale-105 shadow-sm'
                      : 'hover:scale-110 hover:shadow-sm'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.label}
                  id={`swatch-${preset.color.replace('#', '')}`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Or Customize Color
              </label>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                {selectedColor.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-350 shadow-inner flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                  id="input-hex-custom-color"
                />
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={7}
                  value={selectedColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 7) {
                      setSelectedColor(val);
                    } else if (!val.startsWith('#') && val.length <= 6) {
                      setSelectedColor(`#${val}`);
                    }
                  }}
                  placeholder="#000000"
                  className="w-full uppercase font-mono text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                  id="input-hex-text-color"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              id="btn-cancel-new-cat"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm font-medium transition-colors"
              id="btn-submit-new-cat"
            >
              Create
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
