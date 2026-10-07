import React, { useState, useMemo } from 'react';
import { TargetPFC, FoodItem } from '../types';
import {
  generateDinnerRecommendations,
  generateAiDinnerRecommendation,
  RecommendedMealPlan,
  RecommendedItem,
} from '../lib/mealRecommender';
import { Sparkles, Utensils, ChefHat, Check, ChevronDown, ChevronUp, Store, Zap, PlusCircle } from 'lucide-react';

interface DinnerRecommendationCardProps {
  target: TargetPFC;
  currentItems: FoodItem[];
  breakfastItems: FoodItem[];
  lunchItems: FoodItem[];
  dinnerItems: FoodItem[];
  apiKey?: string;
  onAddRecommendedMeal: (items: RecommendedItem[]) => void;
}

export const DinnerRecommendationCard: React.FC<DinnerRecommendationCardProps> = ({
  target,
  currentItems,
  breakfastItems,
  lunchItems,
  dinnerItems,
  apiKey,
  onAddRecommendedMeal,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_home');
  const [aiPlan, setAiPlan] = useState<RecommendedMealPlan | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [addedPlanId, setAddedPlanId] = useState<string | null>(null);

  // 朝・昼に何か記録されているか
  const hasRecordedBeforeDinner = breakfastItems.length > 0 || lunchItems.length > 0;

  // レコメンドデータの計算
  const recommendation = useMemo(() => {
    return generateDinnerRecommendations({
      target,
      currentItems,
      breakfastItems,
      lunchItems,
      dinnerItems,
    });
  }, [target, currentItems, breakfastItems, lunchItems, dinnerItems]);

  const allPlans = useMemo(() => {
    if (aiPlan) {
      return [aiPlan, ...recommendation.plans];
    }
    return recommendation.plans;
  }, [recommendation.plans, aiPlan]);

  const activePlan = allPlans.find((p) => p.id === selectedPlanId) || allPlans[0];

  // AI提案の呼び出し
  const handleAskAi = async () => {
    if (!apiKey) {
      alert('AI提案をご利用いただくには、設定画面でGemini APIキーの入力が必要です。');
      return;
    }
    setIsLoadingAi(true);
    try {
      const plan = await generateAiDinnerRecommendation(apiKey, {
        target,
        currentItems,
        breakfastItems,
        lunchItems,
        dinnerItems,
      });
      if (plan) {
        setAiPlan(plan);
        setSelectedPlanId(plan.id);
      } else {
        alert('AI提案の生成に失敗しました。APIキーをご確認ください。');
      }
    } catch (e: any) {
      console.error(e);
      alert('AI提案の生成中にエラーが発生しました。');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleApplyMeal = (plan: RecommendedMealPlan) => {
    onAddRecommendedMeal(plan.items);
    setAddedPlanId(plan.id);
    setTimeout(() => setAddedPlanId(null), 3000);
  };

  if (!hasRecordedBeforeDinner) {
    return null; // 朝も昼もまだ何も記録されていない場合は表示しない
  }

  const { remainingPFC, adviceMessage } = recommendation;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 rounded-2xl border border-orange-200/80 shadow-xs p-4 sm:p-5 mb-6 transition-all">
      {/* ヘッダー・開閉バー */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-orange-500/30">
            <ChefHat size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                今夜のおすすめ夕食提案
              </h3>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                PFC自動最適化
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              朝と昼の摂取実績から、夜にぴったりなメニューを提案します
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
        >
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-orange-200/60 space-y-4 animate-in fade-in duration-200">
          {/* 残りPFCメーター & アドバイス */}
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-orange-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">今夜の残り枠目安:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  {Math.round(remainingPFC.calories)} kcal
                </span>
                <span className={`px-2 py-0.5 rounded ${remainingPFC.protein > 0 ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  P: {remainingPFC.protein > 0 ? `あと${remainingPFC.protein}g` : '達成済み'}
                </span>
                <span className={`px-2 py-0.5 rounded ${remainingPFC.fat <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                  F: {remainingPFC.fat > 0 ? `あと${remainingPFC.fat}g` : `${Math.abs(remainingPFC.fat)}g 超過`}
                </span>
                <span className={`px-2 py-0.5 rounded ${remainingPFC.carbs > 0 ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  C: {remainingPFC.carbs > 0 ? `あと${remainingPFC.carbs}g` : '達成済み'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              💡 {adviceMessage}
            </p>
          </div>

          {/* プラン切り替えタブ */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {allPlans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const Icon =
                plan.tag === 'home' ? Utensils :
                plan.tag === 'convenience' ? Store :
                plan.tag === 'quick' ? Zap : Sparkles;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                      : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <Icon size={14} />
                  <span>{plan.tagLabel}</span>
                </button>
              );
            })}

            {/* AI提案ボタン */}
            {apiKey && !aiPlan && (
              <button
                type="button"
                onClick={handleAskAi}
                disabled={isLoadingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-xs disabled:opacity-50"
              >
                <Sparkles size={14} className={isLoadingAi ? 'animate-spin' : ''} />
                <span>{isLoadingAi ? 'AI提案作成中...' : 'AIに特製夕食を相談'}</span>
              </button>
            )}
          </div>

          {/* 選択されたプランの詳細カード */}
          {activePlan && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base">
                    {activePlan.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activePlan.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 text-xs">
                  <span className="font-black text-slate-800">{activePlan.totalCalories} kcal</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-orange-600">P:{activePlan.totalProtein}g</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-amber-600">F:{activePlan.totalFat}g</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-sky-600">C:{activePlan.totalCarbs}g</span>
                </div>
              </div>

              {/* アイテム一覧 */}
              <div className="space-y-1.5">
                {activePlan.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      <span className="font-bold text-slate-700">{item.name}</span>
                      {item.weightGrams && (
                        <span className="text-[11px] text-slate-400">({item.weightGrams}g)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>{item.calories} kcal</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">
                        (P:{item.protein} / F:{item.fat} / C:{item.carbs})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 夕食にワンタップ記録ボタン */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleApplyMeal(activePlan)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
                    addedPlanId === activePlan.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {addedPlanId === activePlan.id ? (
                    <>
                      <Check size={16} />
                      <span>今夜の夕食に記録しました！</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      <span>このメニューを今夜の夕食に一括記録する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
