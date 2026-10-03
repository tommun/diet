// PFC & 食事記録に関する型定義

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  amountGrams: number;
  unitName?: string; // "g", "個", "枚" など
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  basePer100g?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface RecipeDish {
  id: string;
  name: string;
  category: string;
  description?: string;
  ingredients: Ingredient[];
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  weightGrams?: number;
  imageUrl?: string; // スクショや写真のデータURL (サムネイル)
  category?: 'staple' | 'packaged' | 'dish' | 'custom';
  stapleKey?: string; // 主食キー
  ingredients?: Ingredient[]; // 料理を構成する材料・分量リスト
  createdAt: string;
}

export interface MealRecord {
  id: string;
  mealType: MealType;
  items: FoodItem[];
  date: string; // YYYY-MM-DD
}

export interface TargetPFC {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  bodyWeight?: number; // 体重(kg)基準設定用
  purpose?: 'cut' | 'maintain' | 'bulk'; // 減量・維持・増量
}

export interface StaplePreset {
  id: string;
  name: string;
  unitName: string; // "g" や "枚"
  defaultAmount: number; // 150g, 1枚 など
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  gramsPerUnit?: number; // 1枚あたり何gか
  note?: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  targetPFC: TargetPFC;
  staplePresets: StaplePreset[];
  customPresets: Omit<FoodItem, 'id' | 'createdAt'>[]; // よく食べる食品
}
