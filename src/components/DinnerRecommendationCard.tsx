import React, { useState, useMemo } from 'react';
import { TargetPFC, FoodItem } from '../types';
import {
  generateDinnerRecommendations,
  generateAiDinnerRecommendation,
  generateCustomDinnerRecommendation,
  RecommendedMealPlan,
  RecommendedItem,
} from '../lib/mealRecommender';
import {
  Sparkles,
  Utensils,
  ChefHat,
  Check,
  ChevronDown,
  ChevronUp,
  Store,
  Zap,
  PlusCircle,
  Key,
  ExternalLink,
  RotateCcw,
  MessageSquare
} from 'lucide-react';

interface DinnerRecommendationCardProps {
  target: TargetPFC;
  currentItems: FoodItem[];
  breakfastItems: FoodItem[];
  lunchItems: FoodItem[];
  dinnerItems: FoodItem[];
  apiKey?: string;
  onAddRecommendedMeal: (items: RecommendedItem[]) => void;
  onSaveApiKey?: (apiKey: string) => void;
  onOpenSettings?: () => void;
}

const QUICK_PROMPTS = [
  '🏪 コンビニで買えるもの',
  '🍳 自炊で10分以内の簡単メニュー',
  '🥗 さっぱりしたヘルシーな和食',
  '🥩 鶏むね肉かササミを使った料理',
  '🍜 麺類（そば・うどん・パスタ）',
  '🍺 軽めのおつまみ風メニュー',
];

export const DinnerRecommendationCard: React.FC<DinnerRecommendationCardProps> = ({
  target,
  currentItems,
  breakfastItems,
  lunchItems,
  dinnerItems,
  apiKey,
  onAddRecommendedMeal,
  onSaveApiKey,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_home');
  const [aiPlan, setAiPlan] = useState<RecommendedMealPlan | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [addedPlanId, setAddedPlanId] = useState<string | null>(null);
  const [inlineKey, setInlineKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // 朝・昼に何か記録されているか
  const hasRecordedBeforeDinner = breakfastItems.length > 0 || lunchItems.length > 0;

  // ルールベースのレコメンド計算
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

  // メニューの生成（APIキー不要のスマートエンジン＋AIのハイブリッド）
  const handleGenerateMenu = async (customRequest?: string) => {
    const requestText = customRequest !== undefined ? customRequest : userPrompt;
    const activeKey = apiKey || inlineKey.trim();

    // APIキーがある場合はGeminiを優先試行（失敗時は自動でスマートエンジンにフォールバック）
    if (activeKey) {
      setIsLoadingAi(true);
      try {
        const plan = await generateAiDinnerRecommendation(
          activeKey,
          {
            target,
            currentItems,
            breakfastItems,
            lunchItems,
            dinnerItems,
          },
          requestText
        );

        if (plan) {
          setAiPlan(plan);
          setSelectedPlanId(plan.id);
          setIsLoadingAi(false);
          return;
        }
      } catch (e: any) {
        console.warn('Gemini API call failed, gracefully falling back to smart rule engine:', e);
      } finally {
        setIsLoadingAi(false);
      }
    }

    // ★APIキー不要！自然言語リクエストと残りPFCから即座に最適なメニューを生成
    const customPlan = generateCustomDinnerRecommendation(
      {
        target,
        currentItems,
        breakfastItems,
        lunchItems,
        dinnerItems,
      },
      requestText
    );

    setAiPlan(customPlan);
    setSelectedPlanId(customPlan.id);
  };

  const handleSaveInlineKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineKey.trim()) return;
    if (onSaveApiKey) {
      onSaveApiKey(inlineKey.trim());
    }
    setShowKeyInput(false);
    handleGenerateMenu();
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
  const effectiveKey = apiKey || inlineKey.trim();

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 rounded-2xl border border-orange-200/80 shadow-xs p-4 sm:p-5 mb-6 transition-all">
      {/* ヘッダー・開閉バー */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-orange-500/30">
            <ChefHat size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                Gemini AI 夕食オーダーメイド提案
              </h3>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                PFC自動最適化
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              朝と昼の摂取実績から、あなたのリクエストに合わせて今夜のメニューをAIが作成します
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors cursor-pointer"
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
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-[11px] flex-wrap">
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

          {/* 💬 ユーザーリクエスト入力ボックス（メインUI） */}
          <div className="bg-white rounded-xl border border-orange-200/80 p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={15} className="text-purple-600" />
                <span>AIシェフに今夜の希望・気分をリクエスト</span>
              </span>
              {!effectiveKey && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings();
                    } else {
                      setShowKeyInput(!showKeyInput);
                    }
                  }}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Key size={12} />
                  <span>APIキーを設定</span>
                </button>
              )}
            </div>

            {/* APIキー入力フォーム（未設定時用） */}
            {showKeyInput && !effectiveKey && (
              <form onSubmit={handleSaveInlineKey} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Gemini APIキーを入力してAI機能を有効化</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-orange-600 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>無料キー取得</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={inlineKey}
                    onChange={(e) => setInlineKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 text-xs shrink-0 cursor-pointer"
                  >
                    保存してAI実行
                  </button>
                </div>
              </form>
            )}

            {/* リクエスト入力フォーム */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateMenu();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="例: コンビニで済ませたい / 鶏むね肉がある / さっぱり麺類 / ガッツリ / おつまみ"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-slate-800 font-medium"
                />
                {userPrompt && (
                  <button
                    type="button"
                    onClick={() => setUserPrompt('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoadingAi}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} className={isLoadingAi ? 'animate-spin' : ''} />
                <span>{isLoadingAi ? '考案中...' : 'メニュー作成'}</span>
              </button>
            </form>

            {/* クイック選択タグ */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                <MessageSquare size={11} />
                <span>よくある要望:</span>
              </span>
              {QUICK_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUserPrompt(promptText);
                    handleGenerateMenu(promptText);
                  }}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200/60 px-2 py-0.8 rounded-lg text-slate-600 transition-colors cursor-pointer"
                >
                  {promptText}
                </button>
              ))}
            </div>
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
          </div>

          {/* 選択されたプランの詳細カード */}
          {activePlan && (
            <div className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-all ${
              activePlan.tag === 'ai' ? 'border-purple-200 ring-2 ring-purple-500/20' : 'border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                      {activePlan.title}
                    </h4>
                    {activePlan.tag === 'ai' && (
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        AIオーダーメイド
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
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

              {/* アクションボタン群 */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                {activePlan.tag === 'ai' ? (
                  <button
                    type="button"
                    onClick={() => handleGenerateMenu()}
                    disabled={isLoadingAi}
                    className="text-xs text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>別のメニューを再生成</span>
                  </button>
                ) : (
                  <span />
                )}

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
