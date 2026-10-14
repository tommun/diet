import { useState, useMemo } from 'react';
import { CoachType, FoodItem, TargetPFC } from '../../types';
import { COACH_PROFILES, CoachProfile } from './characterData';
import { evaluatePFCStatus, getAiCoachDeepAdvice } from '../../lib/coachAdvisor';
import { MessageSquare, Sparkles, RefreshCw, X, ChevronRight } from 'lucide-react';

interface CharacterCardProps {
  target: TargetPFC;
  currentItems: FoodItem[];
  coachType: CoachType;
  apiKey?: string;
  onSelectCoach: (type: CoachType) => void;
  onOpenSettings?: () => void;
}

export function CharacterCard({
  target,
  currentItems,
  coachType,
  apiKey,
  onSelectCoach,
  onOpenSettings
}: CharacterCardProps) {
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const profile: CoachProfile = COACH_PROFILES[coachType] || COACH_PROFILES.piyo;

  // リアルタイムPFCアドバイス算出
  const advice = useMemo(() => {
    return evaluatePFCStatus(target, currentItems, coachType);
  }, [target, currentItems, coachType]);

  // AIに深掘り相談
  const handleConsultAi = async (customPrompt?: string) => {
    if (!apiKey || !apiKey.trim()) {
      setAiError('APIキーが設定されていません。右上の「設定」からGemini APIキーを入力すると、より深い会話相談ができます！');
      return;
    }

    setIsLoadingAi(true);
    setAiError(null);
    try {
      const q = customPrompt !== undefined ? customPrompt : userQuery;
      const res = await getAiCoachDeepAdvice(apiKey, target, currentItems, coachType, q);
      setAiAdvice(res);
    } catch (e: any) {
      console.error('Failed to get AI coach advice', e);
      setAiError(e?.message || '相談の生成に失敗しました。');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-5 mb-6 transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          {/* 左側：キャラクターアバター＆切り替え */}
          <div className="flex sm:flex-col items-center gap-3 self-stretch sm:self-auto sm:w-28 shrink-0 justify-between sm:justify-start">
            <div className="relative group cursor-pointer" onClick={() => setIsConsultOpen(true)}>
              {/* アバター背景サークル */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${profile.bgGradient} flex items-center justify-center text-3xl sm:text-4xl shadow-md shadow-amber-500/10 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300 relative`}>
                <span>{profile.avatarIcon}</span>
                {/* 感情ステータスドット */}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
            </div>

            <div className="text-left sm:text-center">
              <div className="font-black text-slate-800 text-xs sm:text-sm tracking-tight">{profile.name}</div>
              <div className="text-[10px] text-slate-600 font-bold hidden sm:block">{profile.role}</div>
            </div>

            {/* キャラクター切り替えタブ */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {(['piyo', 'muscle', 'elena'] as CoachType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onSelectCoach(t)}
                  className={`px-1.5 py-1 rounded-md text-xs font-bold transition-all ${
                    coachType === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                  title={COACH_PROFILES[t].name}
                >
                  {COACH_PROFILES[t].avatarIcon}
                </button>
              ))}
            </div>
          </div>

          {/* 右側：アドバイス吹き出し */}
          <div className="flex-1 min-w-0 w-full">
            <div className={`relative p-3.5 sm:p-4 rounded-2xl border ${profile.bubbleBg} ${profile.bubbleBorder} shadow-xs`}>
              {/* 吹き出しの三角（PCのみ左側に表示） */}
              <div
                className={`hidden sm:block absolute -left-2 top-6 w-3 h-3 ${profile.bubbleBg} border-l border-b ${profile.bubbleBorder} transform rotate-45`}
              />

              {/* 上部ヘッダー（タイトルとステータスバッジ） */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <h3 className={`font-black text-xs sm:text-sm ${profile.textColor}`}>
                    {advice.title}
                  </h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${advice.statusBadge.color}`}>
                  {advice.statusBadge.text}
                </span>
              </div>

              {/* メッセージ本文 */}
              <p className={`text-xs sm:text-sm leading-relaxed font-bold ${profile.textColor} opacity-90 mb-3`}>
                {advice.message}
              </p>

              {/* おすすめ食材リスト */}
              {advice.recommendedFoods && advice.recommendedFoods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/50">
                  <span className="text-[10px] font-black text-slate-600 mr-1">おすすめ食材:</span>
                  {advice.recommendedFoods.map((food, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] font-black bg-white/80 hover:bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 下部アクション：詳しく相談する */}
            <div className="flex items-center justify-between mt-2.5 px-1">
              <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                PFCの進捗に合わせてリアルタイムにアドバイス中
              </span>

              <button
                onClick={() => {
                  setIsConsultOpen(true);
                  if (apiKey && !aiAdvice) {
                    handleConsultAi();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-black text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg border border-orange-200 transition-colors"
              >
                <MessageSquare size={13} />
                <span>{profile.name}に相談する</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 相談モーダル */}
      {isConsultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* モーダルヘッダー */}
            <div className={`p-4 bg-gradient-to-r ${profile.bgGradient} text-white flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1 bg-white/20 rounded-xl">{profile.avatarIcon}</span>
                <div>
                  <h3 className="font-black text-sm">{profile.name} の栄養相談室</h3>
                  <p className="text-[10px] text-white/80 font-bold">{profile.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsConsultOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* モーダル本文 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* キャラクターからのリアルタイムアドバイス */}
              <div className={`p-3.5 rounded-xl border ${profile.bubbleBg} ${profile.bubbleBorder}`}>
                <div className="font-black text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                  <span>{profile.avatarIcon}</span>
                  <span>{advice.title}</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {advice.message}
                </p>
              </div>

              {/* おすすめの食材 */}
              {advice.recommendedFoods && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-black text-slate-700 text-xs mb-2">💡 いま摂ると効果的な食材</div>
                  <div className="flex flex-wrap gap-1.5">
                    {advice.recommendedFoods.map((f, i) => (
                      <span key={i} className="bg-white text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gemini AI 詳細診断結果 */}
              {aiAdvice && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 mb-2">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>AIコーチからの個別診断メッセージ</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-bold whitespace-pre-line text-xs sm:text-sm">
                    {aiAdvice}
                  </p>
                </div>
              )}

              {/* エラー表示 */}
              {aiError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{aiError}</span>
                  {onOpenSettings && !apiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsConsultOpen(false);
                        onOpenSettings();
                      }}
                      className="text-xs text-red-800 underline font-black hover:text-red-950 shrink-0 text-left"
                    >
                      設定を開く
                    </button>
                  )}
                </div>
              )}

              {/* 相談入力フォーム */}
              <div className="pt-2">
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {profile.name} に質問・相談したいこと
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="例: 夜は何を食べたらいい？ / 甘いものが食べたい！"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConsultAi();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleConsultAi()}
                    disabled={isLoadingAi}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black px-4 py-2 rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {isLoadingAi ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>考え中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>聞く</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* クイック質問タグ */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  '今夜のおすすめメニューは？',
                  '脂質を抑えるにはどうしたらいい？',
                  '甘いものが欲しくなった！',
                  '今日の食事を褒めて！'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserQuery(q);
                      handleConsultAi(q);
                    }}
                    className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold text-[11px]">
                {profile.name} がいつでも見守っています
              </span>
              <button
                onClick={() => setIsConsultOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black px-4 py-1.5 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
