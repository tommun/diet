import { useState, useEffect, useMemo } from 'react';
import { MealType, FoodItem, MealRecord, AppSettings } from './types';
import {
  loadSettings,
  saveSettings,
  loadMeals,
  saveMeals,
  loadFavorites,
  saveFavorites,
  getTodayString,
  DEFAULT_SETTINGS
} from './lib/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MealList } from './components/MealList';
import { FoodLogModal } from './components/FoodLogger/FoodLogModal';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { StaplesConfigModal } from './components/StaplesConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { Plus } from 'lucide-react';

export function App() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [favorites, setFavorites] = useState<Omit<FoodItem, 'id' | 'createdAt'>[]>([]);

  // モーダル管理
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('lunch');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isStaplesModalOpen, setIsStaplesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 初回データロード
  useEffect(() => {
    reloadAllData();
  }, []);

  const reloadAllData = () => {
    const s = loadSettings();
    setSettings(s);
    const m = loadMeals();
    setMeals(m);
    const f = loadFavorites();
    setFavorites(f);
  };

  // 現在の日付に該当するMealRecordを取得（または生成）
  const currentDayMeals = useMemo(() => {
    return meals.filter((m) => m.date === currentDate);
  }, [meals, currentDate]);

  // 今日の全アイテム一覧
  const currentDayItems = useMemo(() => {
    return currentDayMeals.flatMap((m) => m.items);
  }, [currentDayMeals]);

  // itemId -> MealType の対応マップ
  const mealTypeMapping = useMemo(() => {
    const map: Record<string, MealType> = {};
    currentDayMeals.forEach((meal) => {
      meal.items.forEach((item) => {
        map[item.id] = meal.mealType;
      });
    });
    return map;
  }, [currentDayMeals]);

  // 食品の追加
  const handleAddFood = (type: MealType, itemInput: Omit<FoodItem, 'id' | 'createdAt'>) => {
    const newItem: FoodItem = {
      ...itemInput,
      id: 'food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };

    setMeals((prevMeals) => {
      // 該当日の該当MealTypeがあるか
      const targetMealIndex = prevMeals.findIndex(
        (m) => m.date === currentDate && m.mealType === type
      );

      let updated: MealRecord[];
      if (targetMealIndex >= 0) {
        updated = [...prevMeals];
        updated[targetMealIndex] = {
          ...updated[targetMealIndex],
          items: [...updated[targetMealIndex].items, newItem],
        };
      } else {
        const newMeal: MealRecord = {
          id: 'meal_' + Date.now(),
          date: currentDate,
          mealType: type,
          items: [newItem],
        };
        updated = [...prevMeals, newMeal];
      }

      saveMeals(updated);
      return updated;
    });
  };

  // アイテムの削除
  const handleDeleteItem = (itemId: string) => {
    setMeals((prevMeals) => {
      const updated = prevMeals
        .map((m) => {
          if (m.date !== currentDate) return m;
          return {
            ...m,
            items: m.items.filter((item) => item.id !== itemId),
          };
        })
        .filter((m) => m.items.length > 0); // 空の食事レコードは整理

      saveMeals(updated);
      return updated;
    });
  };

  // 目標設定の更新
  const handleSaveTarget = (newTarget: typeof settings.targetPFC) => {
    const updated: AppSettings = { ...settings, targetPFC: newTarget };
    setSettings(updated);
    saveSettings(updated);
  };

  // 主食基準値の更新
  const handleSaveStaples = (newPresets: typeof settings.staplePresets) => {
    const updated: AppSettings = { ...settings, staplePresets: newPresets };
    setSettings(updated);
    saveSettings(updated);
  };

  // アプリ設定の更新
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // お気に入り追加
  const handleSaveFavorite = (fav: Omit<FoodItem, 'id' | 'createdAt'>) => {
    if (favorites.some((f) => f.name === fav.name)) return;
    const updated = [fav, ...favorites];
    setFavorites(updated);
    saveFavorites(updated);
  };

  // お気に入り削除
  const handleDeleteFavorite = (name: string) => {
    const updated = favorites.filter((f) => f.name !== name);
    setFavorites(updated);
    saveFavorites(updated);
  };

  // モーダルオープンハンドラー
  const handleOpenLogModal = (type: MealType = 'lunch') => {
    setActiveMealType(type);
    setIsLogModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ヘッダー */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenTargetSettings={() => setIsTargetModalOpen(true)}
        onOpenStaplesConfig={() => setIsStaplesModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* メインコンテンツ */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 pb-24">
        {/* PFC進捗ダッシュボード */}
        <Dashboard
          target={settings.targetPFC}
          items={currentDayItems}
          onOpenTargetSettings={() => setIsTargetModalOpen(true)}
        />

        {/* 食事一覧（朝・昼・夕・間食） */}
        <MealList
          items={currentDayItems}
          mealTypeMapping={mealTypeMapping}
          onOpenLogModal={handleOpenLogModal}
          onDeleteItem={handleDeleteItem}
        />
      </main>

      {/* フローティング記録ボタン（スマホ・PC共通でワンタップ記録） */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => handleOpenLogModal('lunch')}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-5 py-3.5 rounded-full shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus size={20} className="stroke-[3]" />
          <span>食事を記録する</span>
        </button>
      </div>

      {/* 各種モーダル */}
      <FoodLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        defaultMealType={activeMealType}
        apiKey={settings.geminiApiKey}
        staplePresets={settings.staplePresets}
        favorites={favorites}
        onAddFood={handleAddFood}
        onSaveFavorite={handleSaveFavorite}
        onDeleteFavorite={handleDeleteFavorite}
        onOpenStaplesConfig={() => setIsStaplesModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <TargetSettingsModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        currentTarget={settings.targetPFC}
        onSaveTarget={handleSaveTarget}
      />

      <StaplesConfigModal
        isOpen={isStaplesModalOpen}
        onClose={() => setIsStaplesModalOpen(false)}
        presets={settings.staplePresets}
        onSavePresets={handleSaveStaples}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataReload={reloadAllData}
      />
    </div>
  );
}

export default App;
