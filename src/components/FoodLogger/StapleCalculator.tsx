import React, { useState, useMemo } from 'react';
import { StaplePreset, FoodItem } from '../../types';
import { calculateStaplePFC } from '../../lib/stapleData';
import { Utensils, Check, Sparkles } from 'lucide-react';

interface StapleCalculatorProps {
  presets: StaplePreset[];
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onOpenStaplesConfig: () => void;
}

export const StapleCalculator: React.FC<StapleCalculatorProps> = ({
  presets,
  onAddFoodItem,
  onOpenStaplesConfig,
}) => {
  const [selectedId, setSelectedId] = useState<string>(presets[0]?.id || 'white_rice');
  const [amount, setAmount] = useState<number>(presets[0]?.defaultAmount || 150);

  const currentPreset = useMemo(() => {
    return presets.find((p) => p.id === selectedId) || presets[0];
  }, [presets, selectedId]);

  // 主食が切り替わったときにデフォルト量を反映
  const handleSelectPreset = (preset: StaplePreset) => {
    setSelectedId(preset.id);
    setAmount(preset.defaultAmount);
  };

  // リアルタイムPFC計算
  const calculated = useMemo(() => {
    if (!currentPreset) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0, actualGrams: 0 };
    }
    return calculateStaplePFC(currentPreset, amount || 0);
  }, [currentPreset, amount]);

  // 定番クイック重量ボタンの定義
  const getQuickButtons = (preset: StaplePreset) => {
    if (preset.unitName === '枚') {
      return [
        { label: '0.5枚', val: 0.5 },
        { label: '1枚', val: 1 },
        { label: '1.5枚', val: 1.5 },
        { label: '2枚', val: 2 },
      ];
    }
    if (preset.id === 'pasta_dry') {
      return [
        { label: '80g (少なめ)', val: 80 },
        { label: '100g (1人前)', val: 100 },
        { label: '120g (大盛)', val: 120 },
        { label: '150g (特盛)', val: 150 },
      ];
    }
    if (preset.id === 'pasta_boiled') {
      return [
        { label: '180g (少なめ)', val: 180 },
        { label: '240g (1人前)', val: 240 },
        { label: '300g (大盛)', val: 300 },
      ];
    }
    if (preset.id === 'oatmeal') {
      return [
        { label: '30g (1食)', val: 30 },
        { label: '40g', val: 40 },
        { label: '50g', val: 50 },
      ];
    }
    // ごはん系などデフォルト (g)
    return [
      { label: '小盛 120g', val: 120 },
      { label: '並盛 150g', val: 150 },
      { label: '大盛 200g', val: 200 },
      { label: '特盛 250g', val: 250 },
    ];
  };

  const handleAdd = () => {
    if (!currentPreset) return;
    const displayName =
      currentPreset.unitName === '枚'
        ? `${currentPreset.name} (${amount}枚 / 約${calculated.actualGrams}g)`
        : `${currentPreset.name} (${amount}g)`;

    onAddFoodItem({
      name: displayName,
      calories: calculated.calories,
      protein: calculated.protein,
      fat: calculated.fat,
      carbs: calculated.carbs,
      weightGrams: calculated.actualGrams,
      category: 'staple',
      stapleKey: currentPreset.id,
    });
  };

  return (
    <div className="space-y-4">
      {/* 案内バナー */}
      <div className="bg-sky-50/70 border border-sky-200/80 p-3 rounded-xl text-xs text-sky-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils size={16} className="text-sky-600 shrink-0" />
          <span>
            主食（ご飯・パン・パスタ等）は平均的な標準値から<strong>重量で一発計算</strong>できます。
          </span>
        </div>
        <button
          onClick={onOpenStaplesConfig}
          className="text-sky-700 hover:text-sky-900 font-bold hover:underline shrink-0 ml-2"
        >
          基準値カスタマイズ
        </button>
      </div>

      {/* 主食グリッド選択 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          主食の種類を選択
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-bold text-xs truncate ${
                      isSelected ? 'text-orange-900' : 'text-slate-800'
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  100g = {preset.caloriesPer100g}kcal
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 重量・数量入力エリア */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700">
            摂取する量（{currentPreset.unitName}）を入力
          </label>
          {currentPreset.note && (
            <span className="text-[11px] text-slate-500 font-medium">
              目安: {currentPreset.note}
            </span>
          )}
        </div>

        {/* クイックボタン */}
        <div className="flex flex-wrap gap-2 mb-3">
          {getQuickButtons(currentPreset).map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => setAmount(btn.val)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                amount === btn.val
                  ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* 数値インプット */}
        <div className="relative">
          <input
            type="number"
            step={currentPreset.unitName === '枚' ? '0.5' : '1'}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 text-xl font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
            {currentPreset.unitName}
          </span>
        </div>
      </div>

      {/* 計算結果プレビュー & 追加ボタン */}
      <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-orange-900 flex items-center gap-1">
            <Sparkles size={14} className="text-orange-600" />
            算出された栄養素
          </span>
          <span className="text-xl font-black text-slate-800">
            {calculated.calories} <span className="text-xs font-bold text-slate-500">kcal</span>
          </span>
        </div>

        {/* PFC内訳 */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-white/80 border border-orange-100 rounded-xl p-2">
            <span className="text-[10px] font-bold text-orange-600 block">P たんぱく質</span>
            <span className="text-base font-black text-slate-800">{calculated.protein}g</span>
          </div>
          <div className="bg-white/80 border border-amber-100 rounded-xl p-2">
            <span className="text-[10px] font-bold text-amber-600 block">F 脂質</span>
            <span className="text-base font-black text-slate-800">{calculated.fat}g</span>
          </div>
          <div className="bg-white/80 border border-sky-100 rounded-xl p-2">
            <span className="text-[10px] font-bold text-sky-600 block">C 炭水化物</span>
            <span className="text-base font-black text-slate-800">{calculated.carbs}g</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all"
        >
          <Check size={18} />
          <span>{currentPreset.name}（{amount}{currentPreset.unitName}）を追加</span>
        </button>
      </div>
    </div>
  );
};
