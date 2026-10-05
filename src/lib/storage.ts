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

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    heightCm: 170,
    age: 30,
    gender: 'male',
  },
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
