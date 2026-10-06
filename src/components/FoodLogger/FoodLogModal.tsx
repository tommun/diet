import React, { useState } from 'react';
import { MealType, FoodItem, StaplePreset } from '../../types';
import { PhotoUploader } from './PhotoUploader';
import { StapleCalculator } from './StapleCalculator';
import { DishSearch } from './DishSearch';
import { QuickManualForm } from './QuickManualForm';
import { FoodHistorySelector } from './FoodHistorySelector';
import { X, Camera, Utensils, Zap, SunMedium, Sun, Moon, Coffee, Soup, History } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'history' | 'staple' | 'dish' | 'photo' | 'manual'>('history');

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
