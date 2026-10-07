import { AppSettings, MealRecord, FoodItem, TargetPFC, WeightRecord } from '../types';
import { DEFAULT_STAPLE_PRESETS } from './stapleData';

const SETTINGS_KEY = 'diet_pfc_settings_v1';
const MEALS_KEY = 'diet_pfc_meals_v1';
const FAVORITES_KEY = 'diet_pfc_favorites_v1';
const WEIGHTS_KEY = 'diet_pfc_weights_v1';

export const DEFAULT_TARGET_PFC: TargetPFC = {
  calories: 2000,
  protein: 130, // 26%
  fat: 50,      // 22.5%
  carbs: 255,   // 51%
  bodyWeight: 65,
  targetWeight: 62,
  purpose: 'maintain'
};

export const USER_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1XXF5LhxIpGHB3r4lKt3nwInIMsw4jPsQx_I054TZeqk/edit?usp=sharing';
export const USER_GAS_SYNC_URL = 'https://script.google.com/macros/s/AKfycbyx5IjE-8bK3PLnzA_nKwQC2OXumD_tNGKwZqvNPmZSkp8jEOJKJJFdqFckFJTS2b7rZQ/exec';

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    heightCm: 170,
    age: 30,
    gender: 'male',
  },
  spreadsheetUrl: USER_SPREADSHEET_URL,
  gasSyncUrl: USER_GAS_SYNC_URL,
  targetPFC: DEFAULT_TARGET_PFC,
  staplePresets: DEFAULT_STAPLE_PRESETS,
  customPresets: []
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      spreadsheetUrl: parsed.spreadsheetUrl || USER_SPREADSHEET_URL,
      gasSyncUrl: parsed.gasSyncUrl || USER_GAS_SYNC_URL,
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      targetPFC: { ...DEFAULT_TARGET_PFC, ...(parsed.targetPFC || {}) },
      staplePresets: parsed.staplePresets || DEFAULT_STAPLE_PRESETS,
    };
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadMeals(): MealRecord[] {
  try {
    const raw = localStorage.getItem(MEALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load meals from localStorage', e);
    return [];
  }
}

export function saveMeals(meals: MealRecord[]): void {
  try {
    localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save meals to localStorage', e);
  }
}

// 既存の食事データに新しい食事を追加（マージ）
export function appendMeals(newMeals: MealRecord[]): void {
  try {
    const current = loadMeals();
    const updated = [...current];
    newMeals.forEach((newMeal) => {
      const existingIndex = updated.findIndex(
        (m) => m.date === newMeal.date && m.mealType === newMeal.mealType
      );
      if (existingIndex >= 0) {
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          items: [...existing.items, ...newMeal.items],
        };
      } else {
        updated.push(newMeal);
      }
    });
    saveMeals(updated);
  } catch (e) {
    console.error('Failed to append meals', e);
  }
}


export function loadFavorites(): Omit<FoodItem, 'id' | 'createdAt'>[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
}

export function saveFavorites(favs: Omit<FoodItem, 'id' | 'createdAt'>[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

// 過去に食べた食品のユニーク履歴を取得（最新順）
export function getRecentFoodHistory(limit: number = 60): Array<Omit<FoodItem, 'id' | 'createdAt'> & { lastEatenDate?: string; count?: number }> {
  try {
    const meals = loadMeals();
    // 日付順（新しい順）に並べ替え
    const sortedMeals = [...meals].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    const map = new Map<string, Omit<FoodItem, 'id' | 'createdAt'> & { lastEatenDate?: string; count: number }>();

    for (const meal of sortedMeals) {
      for (const item of meal.items) {
        // 名前とカロリーの組み合わせをキーにして重複判定
        const key = `${item.name.trim()}_${item.calories}_${item.protein}_${item.fat}_${item.carbs}`;
        if (!map.has(key)) {
          map.set(key, {
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            weightGrams: item.weightGrams,
            category: item.category,
            restaurantName: item.restaurantName,
            stapleKey: item.stapleKey,
            ingredients: item.ingredients,
            lastEatenDate: meal.date,
            count: 1
          });
        } else {
          const existing = map.get(key)!;
          existing.count += 1;
        }
      }
    }

    return Array.from(map.values()).slice(0, limit);
  } catch (e) {
    console.error('Failed to get recent food history', e);
    return [];
  }
}

// 日付ごとの食事記録サマリー一覧（最新日付順）
export interface DayMealSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  meals: MealRecord[];
  itemCount: number;
}

export function getMealHistoryByDate(): DayMealSummary[] {
  try {
    const meals = loadMeals();
    const dateMap = new Map<string, MealRecord[]>();

    for (const meal of meals) {
      const d = meal.date || 'unknown';
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(meal);
    }

    const summaries: DayMealSummary[] = [];

    dateMap.forEach((dayMeals, date) => {
      let cal = 0;
      let p = 0;
      let f = 0;
      let c = 0;
      let count = 0;

      for (const m of dayMeals) {
        for (const item of m.items) {
          cal += item.calories;
          p += item.protein;
          f += item.fat;
          c += item.carbs;
          count += 1;
        }
      }

      summaries.push({
        date,
        totalCalories: Math.round(cal),
        totalProtein: Math.round(p * 10) / 10,
        totalFat: Math.round(f * 10) / 10,
        totalCarbs: Math.round(c * 10) / 10,
        meals: dayMeals,
        itemCount: count
      });
    });

    // 日付降順（最新順）にソート
    return summaries.sort((a, b) => b.date.localeCompare(a.date));
  } catch (e) {
    console.error('Failed to get meal history by date', e);
    return [];
  }
}

// 過去の日付の食事を別の日付に丸ごとコピー
export function copyDayMeals(sourceDate: string, targetDate: string): boolean {
  try {
    const meals = loadMeals();
    const sourceMeals = meals.filter(m => m.date === sourceDate);
    if (sourceMeals.length === 0) return false;

    const copiedMeals: MealRecord[] = sourceMeals.map(m => ({
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: targetDate,
      mealType: m.mealType,
      items: m.items.map(item => ({
        ...item,
        id: 'food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString()
      }))
    }));

    appendMeals(copiedMeals);
    return true;
  } catch (e) {
    console.error('Failed to copy day meals', e);
    return false;
  }
}


// 体重記録の読み込みと保存
export function loadWeightRecords(): WeightRecord[] {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (!raw) return [];
    const list: WeightRecord[] = JSON.parse(raw);
    // 日付順にソート (古い順)
    return list.sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    console.error('Failed to load weights', e);
    return [];
  }
}

export function saveWeightRecords(weights: WeightRecord[]): void {
  try {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  } catch (e) {
    console.error('Failed to save weights', e);
  }
}

// 今日の日付文字列 (YYYY-MM-DD)
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// データの全バックアップ / 復元
export function exportAllData(): string {
  const data = {
    settings: loadSettings(),
    meals: loadMeals(),
    favorites: loadFavorites(),
    weights: loadWeightRecords(),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) saveSettings(data.settings);
    if (data.meals) saveMeals(data.meals);
    if (data.favorites) saveFavorites(data.favorites);
    if (data.weights) saveWeightRecords(data.weights);
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

// スプレッドシート(GAS)連携用の同期データ取得・適用
export function getFullSyncData() {
  return {
    settings: loadSettings(),
    meals: loadMeals(),
    favorites: loadFavorites(),
    weights: loadWeightRecords(),
    exportedAt: new Date().toISOString()
  };
}

export function applyFullSyncData(data: any): boolean {
  try {
    if (!data) return false;
    if (data.settings) saveSettings(data.settings);
    if (data.meals && Array.isArray(data.meals)) saveMeals(data.meals);
    if (data.favorites && Array.isArray(data.favorites)) saveFavorites(data.favorites);
    if (data.weights && Array.isArray(data.weights)) saveWeightRecords(data.weights);
    return true;
  } catch (e) {
    console.error('Failed to apply full sync data', e);
    return false;
  }
}

