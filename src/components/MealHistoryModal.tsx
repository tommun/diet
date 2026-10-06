import React, { useState, useMemo } from 'react';
import { getMealHistoryByDate, copyDayMeals, getTodayString, DayMealSummary } from '../lib/storage';
import { X, Calendar, Flame, Copy, ChevronRight, Utensils, Check } from 'lucide-react';

interface MealHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  onDataReload: () => void;
}

export const MealHistoryModal: React.FC<MealHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  onDataReload,
}) => {
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  const historySummaries = useMemo<DayMealSummary[]>(() => {
    return getMealHistoryByDate();
  }, [isOpen]);

  if (!isOpen) return null;

  const today = getTodayString();

  const handleCopy = (sourceDate: string) => {
    if (confirm(`${sourceDate} の食事内容を今日 (${today}) にコピーして追加しますか？`)) {
      const ok = copyDayMeals(sourceDate, today);
      if (ok) {
        setCopiedDate(sourceDate);
        setTimeout(() => setCopiedDate(null), 2000);
        onDataReload();
        onSelectDate(today);
        alert(`${sourceDate} の食事記録を今日に追加しました！`);
      }
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${weekDays[d.getDay()]})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">過去の食事履歴一覧</h2>
              <p className="text-xs text-slate-400 font-medium">日別のPFCバランスとメニュー履歴</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 履歴リスト */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {historySummaries.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Utensils className="mx-auto mb-2 text-slate-300" size={36} />
              <p className="text-sm font-bold text-slate-600">まだ食事の記録がありません</p>
              <p className="text-xs text-slate-400 mt-1">食事を記録すると、日付ごとの履歴がここに保存されます。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historySummaries.map((day) => {
                const isCurrentToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-orange-300 hover:shadow-xs transition-all space-y-3"
                  >
                    {/* 日付ヘッダーと全体数値 */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm sm:text-base">
                          {formatDisplayDate(day.date)}
                        </span>
                        {isCurrentToday && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                            今日
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          {day.itemCount}品
                        </span>
                      </div>

                      {/* アクション */}
                      <div className="flex items-center gap-1.5">
                        {!isCurrentToday && (
                          <button
                            type="button"
                            onClick={() => handleCopy(day.date)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                            title="この日の食事を今日にコピー"
                          >
                            {copiedDate === day.date ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>{copiedDate === day.date ? 'コピー済' : '今日にコピー'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectDate(day.date);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <span>この日を開く</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 1日合計PFC */}
                    <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 p-2.5 rounded-xl text-xs flex-wrap font-bold">
                      <span className="flex items-center gap-1 text-slate-800">
                        <Flame size={14} className="text-orange-500" />
                        {day.totalCalories} kcal
                      </span>
                      <span className="text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">
                        P: {day.totalProtein}g
                      </span>
                      <span className="text-amber-600 bg-amber-50/80 px-2 py-0.5 rounded-md">
                        F: {day.totalFat}g
                      </span>
                      <span className="text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md">
                        C: {day.totalCarbs}g
                      </span>
                    </div>

                    {/* 食事区分ごとのダイジェスト */}
                    <div className="space-y-1.5 text-xs">
                      {day.meals.map((meal) => {
                        const mealName =
                          meal.mealType === 'breakfast'
                            ? '朝食'
                            : meal.mealType === 'lunch'
                            ? '昼食'
                            : meal.mealType === 'dinner'
                            ? '夕食'
                            : '間食';
                        return (
                          <div key={meal.id} className="flex items-start gap-2 text-slate-600">
                            <span className="font-bold text-slate-400 shrink-0 w-8">
                              {mealName}:
                            </span>
                            <span className="text-slate-700 truncate">
                              {meal.items.map((i) => i.name).join('、 ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
