import React, { useState } from 'react';
import { MealType, FoodItem, StaplePreset } from '../../types';
import { PhotoUploader } from './PhotoUploader';
import { StapleCalculator } from './StapleCalculator';
import { DishSearch } from './DishSearch';
import { QuickManualForm } from './QuickManualForm';
import { FoodHistorySelector } from './FoodHistorySelector';
import { X, Camera, Utensils, Zap, SunMedium, Sun, Moon, Coffee, Soup, History, MessageSquare, Send, RefreshCw, Sparkles, Check } from 'lucide-react';
import { parseMealChatText, ParsedMealGroup } from '../../lib/aiMealChatParser';
import { getTodayString } from '../../lib/storage';

interface FoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType: MealType;
  apiKey?: string;
  staplePresets: StaplePreset[];
  favorites: Omit<FoodItem, 'id' | 'createdAt'>[];
  onAddFood: (mealType: MealType, item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onSaveFavorite: (fav: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onDeleteFavorite: (name: string) => void;
  onOpenStaplesConfig: () => void;
  onOpenSettings: () => void;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  isOpen,
  onClose,
  defaultMealType,
  apiKey,
  staplePresets,
  favorites,
  onAddFood,
  onSaveFavorite,
  onDeleteFavorite,
  onOpenStaplesConfig,
  onOpenSettings,
}) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'staple' | 'dish' | 'photo' | 'manual'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isChatParsing, setIsChatParsing] = useState(false);
  const [chatParsedGroups, setChatParsedGroups] = useState<ParsedMealGroup[] | null>(null);

  if (!isOpen) return null;

  const mealTypeLabels: Record<MealType, { label: string; icon: React.ReactNode }> = {
    breakfast: { label: '朝食', icon: <SunMedium size={14} className="text-amber-500" /> },
    lunch: { label: '昼食', icon: <Sun size={14} className="text-orange-500" /> },
    dinner: { label: '夕食', icon: <Moon size={14} className="text-indigo-500" /> },
    snack: { label: '間食', icon: <Coffee size={14} className="text-emerald-500" /> },
  };

  const handleItemAdded = (item: Omit<FoodItem, 'id' | 'createdAt'>) => {
    onAddFood(mealType, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              食事を記録
            </h2>

            {/* 食事区分セレクター */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              {(Object.keys(mealTypeLabels) as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                    mealType === type
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mealTypeLabels[type].icon}
                  <span>{mealTypeLabels[type].label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 入力方法タブ */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'chat'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={15} />
            <span>AIチャット入力</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded-sm">簡単</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History size={15} />
            <span>履歴から追加</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded-sm">最近</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staple')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'staple'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Utensils size={15} />
            <span>主食クイック計算</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dish')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'dish'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Soup size={15} />
            <span>料理・チェーン店検索</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded-sm">公式PFC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'photo'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera size={15} />
            <span>成分表示写真・スクショ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'manual'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap size={15} />
            <span>手動 / マイ食品</span>
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200/70">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">💬</span>
                  <h4 className="font-black text-xs sm:text-sm text-slate-800">
                    食べたものをチャット感覚で入力して即記録！
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  「鶏もも肉200g炒め、ごはん180g」のように自由な文章やコピペで送ると、AIがPFCを自動計算します。
                </p>
              </div>

              <div>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`例:\n鶏もも肉200gと小松菜の炒めもの、ごはん180g\n食パン1枚、目玉焼き2個`}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium resize-none"
                />

                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-slate-400 font-bold">
                    ※複数品目をまとめて入力できます
                  </span>

                  <button
                    type="button"
                    disabled={!chatInput.trim() || isChatParsing}
                    onClick={async () => {
                      if (!chatInput.trim()) return;
                      setIsChatParsing(true);
                      try {
                        const groups = await parseMealChatText(chatInput, getTodayString(), apiKey);
                        setChatParsedGroups(groups);
                      } catch (e: any) {
                        alert('解析に失敗しました: ' + (e?.message || ''));
                      } finally {
                        setIsChatParsing(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
                  >
                    {isChatParsing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>AI解析中...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>解析して追加</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 解析結果プレビュー */}
              {chatParsedGroups && chatParsedGroups.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="font-black text-xs text-slate-700 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>解析された品目（クリックで現在の食事に追加）:</span>
                  </div>

                  {chatParsedGroups.flatMap((g) => g.items).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer shadow-2xs group"
                      onClick={() => {
                        handleItemAdded(item);
                      }}
                    >
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-800 group-hover:text-orange-600">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                          {item.calories} kcal (P:{item.protein}g F:{item.fat}g C:{item.carbs}g)
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-lg shadow-2xs transition-colors shrink-0"
                      >
                        追加
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const allItems = chatParsedGroups.flatMap((g) => g.items);
                      for (const it of allItems) {
                        onAddFood(mealType, it);
                      }
                      onClose();
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>全品目をまとめてこの食事に追加</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <FoodHistorySelector
              onAddFoodItem={handleItemAdded}
              favorites={favorites}
              onToggleFavorite={(fav) => {
                const isFav = favorites.some((f) => f.name.trim() === fav.name.trim());
                if (isFav) {
                  onDeleteFavorite(fav.name);
                } else {
                  onSaveFavorite(fav);
                }
              }}
            />
          )}

          {activeTab === 'staple' && (
            <StapleCalculator
              presets={staplePresets}
              onAddFoodItem={handleItemAdded}
              onOpenStaplesConfig={() => {
                onClose();
                onOpenStaplesConfig();
              }}
            />
          )}

          {activeTab === 'dish' && (
            <DishSearch
              apiKey={apiKey}
              onAddFoodItem={handleItemAdded}
              onOpenSettings={() => {
                onClose();
                onOpenSettings();
              }}
            />
          )}

          {activeTab === 'photo' && (
            <PhotoUploader
              apiKey={apiKey}
              onAddFoodItem={handleItemAdded}
              onOpenSettings={() => {
                onClose();
                onOpenSettings();
              }}
            />
          )}

          {activeTab === 'manual' && (
            <QuickManualForm
              favorites={favorites}
              onAddFoodItem={handleItemAdded}
              onSaveFavorite={onSaveFavorite}
              onDeleteFavorite={onDeleteFavorite}
            />
          )}
        </div>
      </div>
    </div>
  );
};
