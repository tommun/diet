import React, { useState } from 'react';
import { StaplePreset } from '../types';
import { DEFAULT_STAPLE_PRESETS } from '../lib/stapleData';
import { X, Check, RotateCcw } from 'lucide-react';

interface StaplesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: StaplePreset[];
  onSavePresets: (presets: StaplePreset[]) => void;
}

export const StaplesConfigModal: React.FC<StaplesConfigModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePresets,
}) => {
  const [localPresets, setLocalPresets] = useState<StaplePreset[]>(presets);

  if (!isOpen) return null;

  const handleFieldChange = (
    id: string,
    field: keyof Pick<StaplePreset, 'caloriesPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbsPer100g'>,
    value: number
  ) => {
    setLocalPresets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleReset = () => {
    if (window.confirm('主食の基準値を初期設定に戻しますか？')) {
      setLocalPresets(DEFAULT_STAPLE_PRESETS);
    }
  };

  const handleSave = () => {
    onSavePresets(localPresets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              主食の基準値カスタマイズ
            </h2>
            <p className="text-xs text-slate-400">
              普段食べているお米やパスタ、食パンの成分（100gあたり）に合わせて調整できます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            >
              <RotateCcw size={13} />
              <span>標準値にリセット</span>
            </button>
          </div>

          <div className="space-y-3">
            {localPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800">{preset.name}</span>
                  <span className="text-[11px] text-slate-400 font-medium">100gあたり</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">kcal</label>
                    <input
                      type="number"
                      value={preset.caloriesPer100g}
                      onChange={(e) => handleFieldChange(preset.id, 'caloriesPer100g', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-0.5">P (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={preset.proteinPer100g}
                      onChange={(e) => handleFieldChange(preset.id, 'proteinPer100g', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-orange-200 rounded-lg text-xs font-bold text-orange-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-600 mb-0.5">F (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={preset.fatPer100g}
                      onChange={(e) => handleFieldChange(preset.id, 'fatPer100g', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-sky-600 mb-0.5">C (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={preset.carbsPer100g}
                      onChange={(e) => handleFieldChange(preset.id, 'carbsPer100g', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-sky-200 rounded-lg text-xs font-bold text-sky-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>変更を保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
