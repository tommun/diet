import { useState } from 'react';
import { CoachType, MealType } from '../../types';
import { COACH_PROFILES } from '../CharacterCoach/characterData';
import { parseMealChatText, ParsedMealGroup } from '../../lib/aiMealChatParser';
import { Send, Sparkles, Check, RefreshCw, X, ChevronDown, ChevronUp, Trash2, HelpCircle } from 'lucide-react';

interface AiChatInputCardProps {
  currentDate: string;
  apiKey?: string;
  coachType?: CoachType;
  onBatchAddMeals: (groups: ParsedMealGroup[]) => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
  isModal?: boolean;
  defaultMealType?: MealType;
}

export function AiChatInputCard({
  currentDate,
  apiKey,
  coachType = 'piyo',
  onBatchAddMeals,
  onOpenSettings,
  onClose,
  isModal = false,
  defaultMealType = 'dinner',
}: AiChatInputCardProps) {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedGroups, setParsedGroups] = useState<ParsedMealGroup[] | null>(null);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isModal ? true : false);
  const [showTips, setShowTips] = useState(false);

  const coach = COACH_PROFILES[coachType] || COACH_PROFILES.piyo;

  // テキストを解析
  const handleParse = async () => {
    if (!inputText.trim() || isParsing) return;

    setIsParsing(true);
    setParsedGroups(null);
    setIsAddedSuccess(false);

    try {
      const results = await parseMealChatText(inputText, currentDate, apiKey, defaultMealType);
      if (results && results.length > 0) {
        setParsedGroups(results);
        setIsExpanded(true);
      } else {
        alert('食事内容をうまく読み取れませんでした。具体的なメニュー名や分量を入力してください。');
      }
    } catch (e: any) {
      console.error('Failed to parse meal chat text', e);
      alert('解析中にエラーが発生しました: ' + (e?.message || ''));
    } finally {
      setIsParsing(false);
    }
  };

  // プレビュー内の特定品目を削除
  const handleDeleteItem = (groupIndex: number, itemIndex: number) => {
    if (!parsedGroups) return;
    const updated = [...parsedGroups];
    const group = { ...updated[groupIndex] };
    const newItems = group.items.filter((_, idx) => idx !== itemIndex);

    if (newItems.length === 0) {
      // グループごと削除
      const newGroups = updated.filter((_, idx) => idx !== groupIndex);
      setParsedGroups(newGroups.length > 0 ? newGroups : null);
      return;
    }

    const totals = newItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    group.items = newItems;
    group.totalCalories = Math.round(totals.calories);
    group.totalProtein = Math.round(totals.protein * 10) / 10;
    group.totalFat = Math.round(totals.fat * 10) / 10;
    group.totalCarbs = Math.round(totals.carbs * 10) / 10;

    updated[groupIndex] = group;
    setParsedGroups(updated);
  };

  // 一括登録の実行
  const handleApply = () => {
    if (!parsedGroups || parsedGroups.length === 0) return;

    onBatchAddMeals(parsedGroups);
    setIsAddedSuccess(true);
    setTimeout(() => {
      setParsedGroups(null);
      setInputText('');
      setIsAddedSuccess(false);
      onClose?.();
    }, 1500);
  };

  // 全グループの総合計
  const totalStats = parsedGroups?.reduce(
    (acc, g) => ({
      calories: acc.calories + g.totalCalories,
      protein: acc.protein + g.totalProtein,
      fat: acc.fat + g.totalFat,
      carbs: acc.carbs + g.totalCarbs,
      itemsCount: acc.itemsCount + g.items.length,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, itemsCount: 0 }
  );

  const isOffline = parsedGroups?.some((g) => g.source === 'offline') || !apiKey;

  return (
    <section className={`bg-white rounded-2xl transition-all ${
      isModal
        ? 'border-0 shadow-none p-0 mb-0'
        : 'shadow-sm border border-slate-200/90 p-4 md:p-5 mb-6 hover:shadow-md'
    }`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <span className="text-base">💬</span>
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
              <span>チャットで食べたものを送るだけ自動記録</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                AI自動分類
              </span>
              {apiKey ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  ✨ Gemini AI対応
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  📋 基本辞書モード
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">
              「晩御飯 サバの水煮缶、大根おろし、ごはん200g」のように自由に入力・コピペOK！
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            title="書き方のコツを見る"
            className="text-slate-400 hover:text-orange-500 p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <HelpCircle size={18} />
          </button>
          {!isModal && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* 書き方のコツのアコーディオン */}
      {showTips && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="font-black mb-1 flex items-center gap-1.5 text-amber-800">
            <span>💡 おすすめの書き方・入力のコツ</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-800/90">
            <li>
              <strong>食事区分</strong>: 行頭に「朝」「昼」「晩御飯」「夕食」「間食」などを書きます。
            </li>
            <li>
              <strong>品目の区切り</strong>: 読点「、」や改行で品目を並べると全品目を確実に認識します。
            </li>
            <li>
              <strong>分量</strong>: 「200g」「半丁」「1缶」「2個」「小盛」など具体的に書くと計算精度が上がります。
            </li>
            <li className="text-orange-800 font-bold">
              記入例: <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">晩御飯 サバの水煮缶、大根おろし、ごはん200g、ノンオイルツナ缶、納豆、豆腐半丁</code>
            </li>
          </ul>
        </div>
      )}

      {/* チャット入力エリア */}
      <div className="relative mt-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder={`食べたものをそのまま入力してね！\n例:\n晩御飯 サバの水煮缶、大根おろし、ごはん200g、ノンオイルツナ缶、納豆、豆腐半丁\n朝食 食パン4枚切り1枚、目玉焼き2個、ミネストローネ`}
          rows={isExpanded || inputText ? 3 : 2}
          className="w-full bg-slate-50 border border-slate-300/80 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium resize-none"
        />

        {/* 送信ボタン ＆ クイック入力チップ */}
        <div className="flex items-center justify-between mt-2 pt-1">
          <div className="hidden sm:flex flex-wrap gap-1.5 text-[11px]">
            {[
              '晩御飯: サバの水煮缶、大根おろし、ごはん200g、納豆',
              '朝: 食パン1枚、目玉焼き2個',
              '昼: 鶏もも肉200g炒め、ごはん180g',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(chip);
                  setIsExpanded(true);
                }}
                className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold transition-colors text-[10px]"
              >
                {chip}
              </button>
            ))}
          </div>

          <button
            onClick={handleParse}
            disabled={!inputText.trim() || isParsing}
            className="ml-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
          >
            {isParsing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>AI解析中...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>AIで自動分類・計算</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 解析結果プレビュー＆一括登録カード */}
      {parsedGroups && parsedGroups.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{coach.avatarIcon}</span>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                  <span>{coach.name} が食事を分類・PFC計算したよ！</span>
                  {parsedGroups[0]?.source === 'ai' ? (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      ✨ Gemini AI高精度
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      📋 基本辞書モード
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 font-bold">
                  内容を確認して「一括登録」を押すと、アプリとスプレッドシートに即時反映されます。
                </p>
              </div>
            </div>

            <button
              onClick={() => setParsedGroups(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X size={16} />
            </button>
          </div>

          {/* オフライン時の案内（Gemini APIキー登録の誘導） */}
          {isOffline && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 mb-3 text-xs text-blue-900 flex items-center justify-between gap-2">
              <div className="text-[11px] font-medium leading-relaxed">
                <span>💡 <strong>基本辞書モードで解析しました。</strong></span>
                <span className="hidden sm:inline"> 外食メニューやコンビニ商品、マイナーな食材も完全自動で高精度に計算したい場合は、右上の⚙️設定から無料のGemini APIキーをご登録ください。</span>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="shrink-0 text-[11px] font-black text-blue-700 bg-white border border-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  ⚙️ API設定
                </button>
              )}
            </div>
          )}

          {/* 食事区分ごとのグループプレビュー */}
          <div className="space-y-3 mb-4">
            {parsedGroups.map((group, gIdx) => {
              const badgeColors: Record<MealType, string> = {
                breakfast: 'bg-amber-100 text-amber-800 border-amber-300',
                lunch: 'bg-orange-100 text-orange-800 border-orange-300',
                dinner: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                snack: 'bg-emerald-100 text-emerald-800 border-emerald-300',
              };

              return (
                <div key={gIdx} className="bg-slate-50/80 rounded-xl p-3 border border-slate-200">
                  {/* グループヘッダー */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeColors[group.mealType]}`}>
                        {group.mealTypeLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {group.date}
                      </span>
                    </div>

                    <div className="text-[11px] font-black text-slate-700">
                      {group.totalCalories} kcal
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        (P:{group.totalProtein}g F:{group.totalFat}g C:{group.totalCarbs}g)
                      </span>
                    </div>
                  </div>

                  {/* 食品品目リスト（削除ボタン付き） */}
                  <div className="space-y-1.5">
                    {group.items.map((item, iIdx) => (
                      <div
                        key={item.id || iIdx}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-bold text-slate-800 truncate">{item.name}</span>
                          {item.weightGrams && (
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">
                              {item.weightGrams}g
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <span className="font-black text-slate-700">{item.calories} kcal</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1.5 hidden sm:inline">
                              P:{item.protein} F:{item.fat} C:{item.carbs}
                            </span>
                          </div>

                          {/* 削除ボタン */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(gIdx, iIdx)}
                            title="この品目を削除"
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 総合計と一括登録ボタン */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-xl border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            {totalStats && (
              <div className="text-left w-full sm:w-auto">
                <div className="text-[11px] font-bold text-orange-900">
                  全 {totalStats.itemsCount} 品目の推定合計:
                </div>
                <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span className="text-base text-orange-600">{totalStats.calories} kcal</span>
                  <span className="text-xs text-slate-600 font-bold">
                    P: {Math.round(totalStats.protein * 10) / 10}g / F: {Math.round(totalStats.fat * 10) / 10}g / C: {Math.round(totalStats.carbs * 10) / 10}g
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={isAddedSuccess}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 ${
                isAddedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 hover:scale-105 active:scale-95'
              }`}
            >
              {isAddedSuccess ? (
                <>
                  <Check size={16} className="stroke-[3]" />
                  <span>スプレッドシートに一括保存完了！</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>この内容で一括登録する</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
