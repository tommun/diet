import { useState, useEffect, useMemo } from 'react';
import { MealType, FoodItem, MealRecord, AppSettings, WeightRecord, UserProfile } from './types';
import {
  loadSettings,
  saveSettings,
  loadMeals,
  saveMeals,
  loadFavorites,
  saveFavorites,
  loadWeightRecords,
  saveWeightRecords,
  appendMeals,
  getTodayString,
  DEFAULT_SETTINGS,
  getFullSyncData,
  applyFullSyncData
} from './lib/storage';
import { syncLoadFromSheets, syncSaveToSheets } from './lib/sheetsSync';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MealList } from './components/MealList';
import { FoodLogModal } from './components/FoodLogger/FoodLogModal';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { StaplesConfigModal } from './components/StaplesConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { WeightModal } from './components/Weight/WeightModal';
import { MealHistoryModal } from './components/MealHistoryModal';
import { DinnerRecommendationCard } from './components/DinnerRecommendationCard';
import { RecommendedItem } from './lib/mealRecommender';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Plus } from 'lucide-react';

export function App() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [favorites, setFavorites] = useState<Omit<FoodItem, 'id' | 'createdAt'>[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // モーダル管理
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('lunch');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isStaplesModalOpen, setIsStaplesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 初回データロード & URLパラメータによる食事データ自動取り込み
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get('import_meals');
      if (importParam) {
        let jsonStr = '';
        try {
          jsonStr = decodeURIComponent(importParam);
          if (!jsonStr.trim().startsWith('[') && !jsonStr.trim().startsWith('{')) {
            jsonStr = decodeURIComponent(escape(atob(importParam)));
          }
        } catch {
          try {
            jsonStr = atob(importParam);
          } catch {
            jsonStr = importParam;
          }
        }

        const data = JSON.parse(jsonStr);
        const mealsToAdd = Array.isArray(data) ? data : data.meals ? data.meals : [data];
        if (Array.isArray(mealsToAdd) && mealsToAdd.length > 0) {
          appendMeals(mealsToAdd);
          alert('本日の食事記録（朝・昼・夜）を正常に追加・保存しました！');
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
      const syncParam = params.get('sync') || params.get('sync_url');
      if (syncParam) {
        let targetGasUrl = '';
        try {
          if (syncParam.startsWith('http')) {
            targetGasUrl = syncParam;
          } else {
            targetGasUrl = atob(syncParam);
          }
        } catch {
          targetGasUrl = syncParam;
        }

        if (targetGasUrl && targetGasUrl.startsWith('https://script.google.com/')) {
          const currentS = loadSettings();
          const updatedS = { ...currentS, gasSyncUrl: targetGasUrl.trim() };
          saveSettings(updatedS);
          setSettings(updatedS);
          pullFromSheets(targetGasUrl.trim());
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.error('Failed to parse URL parameters', e);
    }
    const initialSettings = loadSettings();
    reloadAllData();

    // スプレッドシートURLが設定されている場合、起動時にクラウドから最新データを自動取得
    if (initialSettings.gasSyncUrl && initialSettings.gasSyncUrl.trim()) {
      pullFromSheets(initialSettings.gasSyncUrl.trim());
    }
  }, []);

  const reloadAllData = () => {
    const s = loadSettings();
    setSettings(s);
    const m = loadMeals();
    setMeals(m);
    const f = loadFavorites();
    setFavorites(f);
    const w = loadWeightRecords();
    setWeightRecords(w);
  };

  // スプレッドシートからデータを取得して反映
  const pullFromSheets = async (url: string) => {
    setIsSyncing(true);
    try {
      const remoteData = await syncLoadFromSheets(url);
      if (remoteData && (remoteData.meals || remoteData.settings)) {
        applyFullSyncData(remoteData);
        reloadAllData();
      }
    } catch (e) {
      console.error('Cloud pull failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // スプレッドシートへ非同期自動保存（バックグラウンドプッシュ）
  const pushToSheets = async (overrideSettings?: AppSettings) => {
    const targetSettings = overrideSettings || settings;
    if (!targetSettings.gasSyncUrl || !targetSettings.gasSyncUrl.trim()) return;

    setIsSyncing(true);
    try {
      const fullData = getFullSyncData();
      if (overrideSettings) {
        fullData.settings = overrideSettings;
      }
      await syncSaveToSheets(targetSettings.gasSyncUrl.trim(), fullData);
    } catch (e) {
      console.error('Cloud push failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // 手動同期ボタン（最新取得＆更新）
  const triggerManualSync = async () => {
    if (!settings.gasSyncUrl || !settings.gasSyncUrl.trim()) {
      setIsSettingsModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      // まずリモートから取得
      const remote = await syncLoadFromSheets(settings.gasSyncUrl.trim());
      if (remote) {
        applyFullSyncData(remote);
        reloadAllData();
      }
      // 最新ローカル状態を再度プッシュ
      const full = getFullSyncData();
      await syncSaveToSheets(settings.gasSyncUrl.trim(), full);
      alert('スプレッドシートとの同期が完了しました！');
    } catch (e: any) {
      console.error('Manual sync failed', e);
      alert(`同期に失敗しました: ${e.message || 'URLと権限をご確認ください'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 現在の日付に該当するMealRecordを取得（または生成）
  const currentDayMeals = useMemo(() => {
    return meals.filter((m) => m.date === currentDate);
  }, [meals, currentDate]);

  // 今日の全アイテム一覧
  const currentDayItems = useMemo(() => {
    return currentDayMeals.flatMap((m) => m.items);
  }, [currentDayMeals]);

  const breakfastItems = useMemo(() => {
    return currentDayMeals.find((m) => m.mealType === 'breakfast')?.items || [];
  }, [currentDayMeals]);

  const lunchItems = useMemo(() => {
    return currentDayMeals.find((m) => m.mealType === 'lunch')?.items || [];
  }, [currentDayMeals]);

  const dinnerItems = useMemo(() => {
    return currentDayMeals.find((m) => m.mealType === 'dinner')?.items || [];
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

  // レコメンド夕食の一括追加
  const handleAddRecommendedMeal = (recommendedItems: RecommendedItem[]) => {
    const newItems: FoodItem[] = recommendedItems.map((item, idx) => ({
      id: 'food_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      name: item.name,
      weightGrams: item.weightGrams,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      createdAt: new Date().toISOString(),
    }));

    setMeals((prevMeals) => {
      const targetMealIndex = prevMeals.findIndex(
        (m) => m.date === currentDate && m.mealType === 'dinner'
      );

      let updated: MealRecord[];
      if (targetMealIndex >= 0) {
        updated = [...prevMeals];
        updated[targetMealIndex] = {
          ...updated[targetMealIndex],
          items: [...updated[targetMealIndex].items, ...newItems],
        };
      } else {
        const newMeal: MealRecord = {
          id: 'meal_' + Date.now(),
          date: currentDate,
          mealType: 'dinner',
          items: newItems,
        };
        updated = [...prevMeals, newMeal];
      }

      saveMeals(updated);
      setTimeout(() => pushToSheets(), 300);
      return updated;
    });
  };

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
      setTimeout(() => pushToSheets(), 300);
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
      setTimeout(() => pushToSheets(), 300);
      return updated;
    });
  };

  // 目標設定の更新
  const handleSaveTarget = (newTarget: typeof settings.targetPFC) => {
    const updated: AppSettings = { ...settings, targetPFC: newTarget };
    setSettings(updated);
    saveSettings(updated);
    setTimeout(() => pushToSheets(updated), 300);
  };

  // 主食基準値の更新
  const handleSaveStaples = (newPresets: typeof settings.staplePresets) => {
    const updated: AppSettings = { ...settings, staplePresets: newPresets };
    setSettings(updated);
    saveSettings(updated);
    setTimeout(() => pushToSheets(updated), 300);
  };

  // アプリ設定の更新
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    pushToSheets(newSettings);
  };

  // お気に入り追加
  const handleSaveFavorite = (fav: Omit<FoodItem, 'id' | 'createdAt'>) => {
    if (favorites.some((f) => f.name === fav.name)) return;
    const updated = [fav, ...favorites];
    setFavorites(updated);
    saveFavorites(updated);
    setTimeout(() => pushToSheets(), 300);
  };

  // お気に入り削除
  const handleDeleteFavorite = (name: string) => {
    const updated = favorites.filter((f) => f.name !== name);
    setFavorites(updated);
    saveFavorites(updated);
    setTimeout(() => pushToSheets(), 300);
  };

  // 体重の追加・更新
  const handleSaveWeight = (rec: Omit<WeightRecord, 'id' | 'createdAt'>) => {
    setWeightRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.date === rec.date);
      let updated: WeightRecord[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...rec,
        };
      } else {
        const newRecord: WeightRecord = {
          ...rec,
          id: 'weight_' + Date.now(),
          createdAt: new Date().toISOString(),
        };
        updated = [...prev, newRecord];
      }
      saveWeightRecords(updated);
      setTimeout(() => pushToSheets(), 300);
      return updated;
    });
  };

  // 体重の削除
  const handleDeleteWeight = (id: string) => {
    setWeightRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveWeightRecords(updated);
      setTimeout(() => pushToSheets(), 300);
      return updated;
    });
  };

  // 今日の体重レコード
  const todayWeightRecord = useMemo(() => {
    return weightRecords.find((r) => r.date === currentDate);
  }, [weightRecords, currentDate]);

  // モーダルオープンハンドラー
  const handleOpenLogModal = (type: MealType = 'lunch') => {
    setActiveMealType(type);
    setIsLogModalOpen(true);
  };

  // プロフィール更新
  const handleSaveProfile = (newProfile: UserProfile) => {
    const updated: AppSettings = { ...settings, profile: newProfile };
    setSettings(updated);
    saveSettings(updated);
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
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        spreadsheetUrl={settings.spreadsheetUrl}
        isSyncing={isSyncing}
        onTriggerSync={triggerManualSync}
      />

      {/* メインコンテンツ */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 pb-24">
        {/* PFC進捗ダッシュボード */}
        <Dashboard
          target={settings.targetPFC}
          items={currentDayItems}
          todayWeightRecord={todayWeightRecord}
          onOpenTargetSettings={() => setIsTargetModalOpen(true)}
          onOpenWeightModal={() => setIsWeightModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          isSheetsConfigured={Boolean(settings.gasSyncUrl && settings.gasSyncUrl.trim())}
        />

        {/* 今夜のおすすめ夕食提案カード（朝・昼が記録されている場合に表示） */}
        <DinnerRecommendationCard
          target={settings.targetPFC}
          currentItems={currentDayItems}
          breakfastItems={breakfastItems}
          lunchItems={lunchItems}
          dinnerItems={dinnerItems}
          apiKey={settings.geminiApiKey}
          onAddRecommendedMeal={handleAddRecommendedMeal}
          onSaveApiKey={(key) => handleSaveSettings({ ...settings, geminiApiKey: key })}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
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

      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentDate={currentDate}
        weightRecords={weightRecords}
        targetWeight={settings.targetPFC.targetWeight || 62}
        profile={settings.profile}
        onSaveWeight={handleSaveWeight}
        onDeleteWeight={handleDeleteWeight}
        onSaveProfile={handleSaveProfile}
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

      <ErrorBoundary
        key={isSettingsModalOpen ? 'settings-open' : 'settings-closed'}
        fallbackTitle="設定画面の表示中にエラーが発生しました"
      >
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onDataReload={reloadAllData}
        />
      </ErrorBoundary>

      <MealHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectDate={setCurrentDate}
        onDataReload={reloadAllData}
      />
    </div>
  );
}

export default App;
