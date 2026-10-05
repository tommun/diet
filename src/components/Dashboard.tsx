import React from 'react';
import { TargetPFC, FoodItem, WeightRecord } from '../types';
import { Flame, Beef, Droplet, Wheat, Scale } from 'lucide-react';

interface DashboardProps {
  target: TargetPFC;
  items: FoodItem[];
  todayWeightRecord?: WeightRecord;
  onOpenTargetSettings: () => void;
  onOpenWeightModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  target,
  items,
  todayWeightRecord,
  onOpenTargetSettings,
  onOpenWeightModal,
}) => {
  // 合計摂取量を計算
  const totals = items.reduce(
    (acc, item) => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.fat += item.fat || 0;
      acc.carbs += item.carbs || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  // 四捨五入
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;

  // 残りグラム数
  const remaining = {
    calories: target.calories - totals.calories,
    protein: Math.round((target.protein - totals.protein) * 10) / 10,
    fat: Math.round((target.fat - totals.fat) * 10) / 10,
    carbs: Math.round((target.carbs - totals.carbs) * 10) / 10,
  };

  // 進捗率 (%)
  const getPercent = (current: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
  };

  // PFCカロリー比率 (P: 4kcal/g, F: 9kcal/g, C: 4kcal/g)
  const pKcal = totals.protein * 4;
  const fKcal = totals.fat * 9;
  const cKcal = totals.carbs * 4;
  const totalCalcKcal = pKcal + fKcal + cKcal || 1;
  const pRatio = Math.round((pKcal / totalCalcKcal) * 100);
  const fRatio = Math.round((fKcal / totalCalcKcal) * 100);
  const cRatio = Math.max(0, 100 - pRatio - fRatio);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      {/* カロリー総合メーター */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Calories</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{totals.calories}</span>
              <span className="text-sm font-semibold text-slate-500">/ {target.calories} kcal</span>
            </div>
          </div>
        </div>

        {/* 残りカロリー & 今日の体重 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenWeightModal}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
            title="体重を記録・グラフを表示"
          >
            <Scale size={15} className="text-emerald-600" />
            {todayWeightRecord ? (
              <span>
                今日: <span className="text-sm font-black">{todayWeightRecord.weight}</span> kg
              </span>
            ) : (
              <span>＋ 体重を記録</span>
            )}
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl">
            <span className="text-xs font-medium text-slate-500">今日あと:</span>
            <span
              className={`text-lg font-black ${
                remaining.calories >= 0 ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {remaining.calories >= 0 ? `${remaining.calories} kcal` : `${Math.abs(remaining.calories)} kcal 超過`}
            </span>
          </div>
        </div>
      </div>

      {/* PFC 3大栄養素メーター */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {/* P: タンパク質 */}
        <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-orange-800 text-sm">
              <Beef size={16} className="text-orange-600" />
              <span>たんぱく質 (P)</span>
            </div>
            <span className="text-xs font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              {getPercent(totals.protein, target.protein)}%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-black text-slate-800">{totals.protein} <span className="text-xs font-normal text-slate-500">g</span></span>
            <span className="text-xs font-semibold text-slate-500">目標 {target.protein}g</span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-orange-200/60 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${getPercent(totals.protein, target.protein)}%` }}
            />
          </div>

          <div className="text-[11px] font-medium flex justify-between items-center text-slate-500">
            <span>残量:</span>
            <span className={remaining.protein > 0 ? "font-bold text-orange-700" : "font-bold text-emerald-600"}>
              {remaining.protein > 0 ? `あと ${remaining.protein}g` : `達成 (+${Math.abs(remaining.protein)}g)`}
            </span>
          </div>
        </div>

        {/* F: 脂質 */}
        <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-sm">
              <Droplet size={16} className="text-amber-600" />
              <span>脂質 (F)</span>
            </div>
            <span
              className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                totals.fat > target.fat
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {getPercent(totals.fat, target.fat)}%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-black text-slate-800">{totals.fat} <span className="text-xs font-normal text-slate-500">g</span></span>
            <span className="text-xs font-semibold text-slate-500">目標 {target.fat}g</span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-amber-200/60 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                totals.fat > target.fat ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${getPercent(totals.fat, target.fat)}%` }}
            />
          </div>

          <div className="text-[11px] font-medium flex justify-between items-center text-slate-500">
            <span>残量:</span>
            <span className={remaining.fat >= 0 ? "font-bold text-amber-700" : "font-bold text-rose-600"}>
              {remaining.fat >= 0 ? `あと ${remaining.fat}g` : `${Math.abs(remaining.fat)}g 超過`}
            </span>
          </div>
        </div>

        {/* C: 炭水化物 */}
        <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-800 text-sm">
              <Wheat size={16} className="text-sky-600" />
              <span>炭水化物 (C)</span>
            </div>
            <span className="text-xs font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
              {getPercent(totals.carbs, target.carbs)}%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-black text-slate-800">{totals.carbs} <span className="text-xs font-normal text-slate-500">g</span></span>
            <span className="text-xs font-semibold text-slate-500">目標 {target.carbs}g</span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-sky-200/60 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${getPercent(totals.carbs, target.carbs)}%` }}
            />
          </div>

          <div className="text-[11px] font-medium flex justify-between items-center text-slate-500">
            <span>残量:</span>
            <span className={remaining.carbs >= 0 ? "font-bold text-sky-700" : "font-bold text-rose-600"}>
              {remaining.carbs >= 0 ? `あと ${remaining.carbs}g` : `${Math.abs(remaining.carbs)}g 超過`}
            </span>
          </div>
        </div>
      </div>

      {/* PFC比率バー */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">現在のPFCエネルギー比率:</span>
          <div className="flex items-center gap-1 font-bold">
            <span className="text-orange-600">P {pRatio}%</span>
            <span className="text-slate-300">/</span>
            <span className="text-amber-600">F {fRatio}%</span>
            <span className="text-slate-300">/</span>
            <span className="text-sky-600">C {cRatio}%</span>
          </div>
        </div>
        <button
          onClick={onOpenTargetSettings}
          className="text-orange-600 hover:text-orange-700 hover:underline font-semibold text-xs transition-colors"
        >
          目標を変更
        </button>
      </div>
    </div>
  );
};
