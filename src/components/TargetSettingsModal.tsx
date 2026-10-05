import React, { useState } from 'react';
import { TargetPFC } from '../types';
import { X, Calculator, Check, Info } from 'lucide-react';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: TargetPFC;
  onSaveTarget: (target: TargetPFC) => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTarget,
  onSaveTarget,
}) => {
  const [calories, setCalories] = useState<number>(currentTarget.calories);
  const [protein, setProtein] = useState<number>(currentTarget.protein);
  const [fat, setFat] = useState<number>(currentTarget.fat);
  const [carbs, setCarbs] = useState<number>(currentTarget.carbs);

  // シミュレーター用ステート
  const [weight, setWeight] = useState<number>(currentTarget.bodyWeight || 65);
  const [targetWeight, setTargetWeight] = useState<number>(currentTarget.targetWeight || 62);
  const [purpose, setPurpose] = useState<'cut' | 'maintain' | 'bulk'>(currentTarget.purpose || 'maintain');

  if (!isOpen) return null;

  // 自動シミュレーション計算
  const handleAutoCalculate = () => {
    // 基礎計算（一般的なフィットネス基準）
    // 減量: 体重×30kcal - 300kcal / 維持: 体重×33kcal / 増量: 体重×36kcal
    let baseCalories = 2000;
    let pGrams = Math.round(weight * 2.0); // 体重の2倍タンパク質
    let fRatio = 0.22; // 脂質22%

    if (purpose === 'cut') {
      baseCalories = Math.round(weight * 28);
      pGrams = Math.round(weight * 2.2); // 減量中は筋肉保護のため多め
      fRatio = 0.20;
    } else if (purpose === 'maintain') {
      baseCalories = Math.round(weight * 32);
      pGrams = Math.round(weight * 2.0);
      fRatio = 0.22;
    } else if (purpose === 'bulk') {
      baseCalories = Math.round(weight * 36);
      pGrams = Math.round(weight * 2.0);
      fRatio = 0.25;
    }

    const fKcal = baseCalories * fRatio;
    const fGrams = Math.round(fKcal / 9);
    const pKcal = pGrams * 4;
    const cKcal = Math.max(0, baseCalories - pKcal - fKcal);
    const cGrams = Math.round(cKcal / 4);

    setCalories(baseCalories);
    setProtein(pGrams);
    setFat(fGrams);
    setCarbs(cGrams);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTarget({
      calories: Number(calories),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      bodyWeight: weight,
      targetWeight: targetWeight,
      purpose,
    });
    onClose();
  };

  // 合計PFCからの逆算カロリー
  const calculatedTotalKcal = protein * 4 + fat * 9 + carbs * 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800">1日の目標PFC・カロリー設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* 自動計算シミュレーター */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-700 mb-3">
              <Calculator size={15} className="text-orange-500" />
              <span>かんたん自動計算シミュレーター</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  現在の体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  目標体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  目的
                </label>
                <select
                  value={purpose}
                  onChange={(e: any) => setPurpose(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold"
                >
                  <option value="cut">減量</option>
                  <option value="maintain">維持</option>
                  <option value="bulk">増量</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoCalculate}
              className="w-full py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-orange-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>この条件からおすすめ目標値を自動算出</span>
            </button>
          </div>

          {/* 目標値フォーム */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1日の目標摂取カロリー (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-lg font-black focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1">
                  タンパク質 P (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/40 text-base font-black text-slate-800 focus:ring-2 focus:ring-orange-500/30"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {protein * 4} kcal
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1">
                  脂質 F (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/40 text-base font-black text-slate-800 focus:ring-2 focus:ring-amber-500/30"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {fat * 9} kcal
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-700 mb-1">
                  炭水化物 C (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-sky-50/40 text-base font-black text-slate-800 focus:ring-2 focus:ring-sky-500/30"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {carbs * 4} kcal
                </span>
              </div>
            </div>

            {/* PFCからの合計チェック */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Info size={14} className="text-slate-400" /> PFC合計カロリー:
              </span>
              <span className="font-extrabold text-slate-800">
                {calculatedTotalKcal} kcal
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all mt-4"
            >
              <Check size={18} />
              <span>目標設定を保存</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
