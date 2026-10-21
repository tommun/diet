import React, { useState, useEffect } from 'react';
import { MealType, FoodItem, StaplePreset, CoachType } from '../../types';
import { PhotoUploader } from './PhotoUploader';
import { StapleCalculator } from './StapleCalculator';
import { DishSearch } from './DishSearch';
import { QuickManualForm } from './QuickManualForm';
import { FoodHistorySelector } from './FoodHistorySelector';
import { AiChatInputCard } from '../AiChatLogger/AiChatInputCard';
import { ParsedMealGroup } from '../../lib/aiMealChatParser';
import { X, Camera, Utensils, Zap, SunMedium, Sun, Moon, Coffee, Soup, History } from 'lucide-react';

interface FoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType: MealType;
  currentDate: string;
  apiKey?: string;
  coachType?: CoachType;
  staplePresets: StaplePreset[];
  favorites: Omit<FoodItem, 'id' | 'createdAt'>[];
  onAddFood: (mealType: MealType, item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onBatchAddMeals: (groups: ParsedMealGroup[]) => void;
  onSaveFavorite: (fav: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onDeleteFavorite: (name: string) => void;
  onOpenStaplesConfig: () => void;
  onOpenSettings: () => void;
  initialTab?: 'chat' | 'history' | 'staple' | 'dish' | 'photo' | 'manual';
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  isOpen,
  onClose,
  defaultMealType,
  currentDate,
  apiKey,
  coachType = 'piyo',
  staplePresets,
  favorites,
  onAddFood,
  onBatchAddMeals,
  onSaveFavorite,
  onDeleteFavorite,
  onOpenStaplesConfig,
  onOpenSettings,
  initialTab = 'chat',
}) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'staple' | 'dish' | 'photo' | 'manual'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType);
      setActiveTab(initialTab || 'chat');
    }
  }, [isOpen, defaultMealType, initialTab]);

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
                      ? 'bg-white text-slate-800 shadow-2xs font-black'
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

        {/* 入力方法セレクタータブ */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-3 sm:px-4 pt-2 gap-1.5 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'chat'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <span className="text-sm">💬</span>
            <span>AIチャット自動記録</span>
            <span className="text-[10px] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shadow-2xs">
              おすすめ
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <History size={15} />
            <span>履歴から追加</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staple')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'staple'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Utensils size={15} />
            <span>主食クイック計算</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dish')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'dish'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Soup size={15} />
            <span>料理・外食検索</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'photo'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Camera size={15} />
            <span>成分表示写真・スクショ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'manual'
                ? 'border-orange-500 text-orange-600 bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Zap size={15} />
            <span>手動 / マイ食品</span>
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'chat' && (
            <div className="py-1">
              <AiChatInputCard
                currentDate={currentDate}
                apiKey={apiKey}
                coachType={coachType}
                onBatchAddMeals={onBatchAddMeals}
                onOpenSettings={onOpenSettings}
                onClose={onClose}
                isModal={true}
                defaultMealType={mealType}
              />
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
