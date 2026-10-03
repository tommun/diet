import { StaplePreset } from '../types';

export const DEFAULT_STAPLE_PRESETS: StaplePreset[] = [
  {
    id: 'white_rice',
    name: '白米（ご飯）',
    unitName: 'g',
    defaultAmount: 150,
    caloriesPer100g: 156,
    proteinPer100g: 2.5,
    fatPer100g: 0.3,
    carbsPer100g: 37.1,
    note: 'お茶碗1杯 約150g (234kcal)'
  },
  {
    id: 'brown_rice',
    name: '玄米（ご飯）',
    unitName: 'g',
    defaultAmount: 150,
    caloriesPer100g: 152,
    proteinPer100g: 2.8,
    fatPer100g: 1.0,
    carbsPer100g: 35.6,
    note: 'お茶碗1杯 約150g (228kcal)'
  },
  {
    id: 'pasta_dry',
    name: 'パスタ（乾麺）',
    unitName: 'g',
    defaultAmount: 100,
    caloriesPer100g: 347,
    proteinPer100g: 13.0,
    fatPer100g: 2.0,
    carbsPer100g: 72.0,
    note: '1人前 約100g（茹でると約240g）'
  },
  {
    id: 'pasta_boiled',
    name: 'パスタ（茹で上がり）',
    unitName: 'g',
    defaultAmount: 240,
    caloriesPer100g: 150,
    proteinPer100g: 5.2,
    fatPer100g: 0.9,
    carbsPer100g: 30.3,
    note: '茹で上がり1人前 約240g'
  },
  {
    id: 'bread_slice',
    name: '食パン (6枚切)',
    unitName: '枚',
    defaultAmount: 1,
    caloriesPer100g: 248,
    proteinPer100g: 8.9,
    fatPer100g: 4.1,
    carbsPer100g: 46.7,
    gramsPerUnit: 60,
    note: '1枚(約60g) 149kcal / P:5.3g F:2.5g C:28.0g'
  },
  {
    id: 'oatmeal',
    name: 'オートミール',
    unitName: 'g',
    defaultAmount: 40,
    caloriesPer100g: 350,
    proteinPer100g: 13.7,
    fatPer100g: 5.7,
    carbsPer100g: 69.1,
    note: '1食目安 約30〜40g'
  },
  {
    id: 'udon_boiled',
    name: 'うどん（ゆで）',
    unitName: 'g',
    defaultAmount: 200,
    caloriesPer100g: 95,
    proteinPer100g: 2.6,
    fatPer100g: 0.4,
    carbsPer100g: 21.6,
    note: '1玉 約200g (190kcal)'
  },
  {
    id: 'soba_boiled',
    name: 'そば（ゆで）',
    unitName: 'g',
    defaultAmount: 180,
    caloriesPer100g: 130,
    proteinPer100g: 4.8,
    fatPer100g: 1.0,
    carbsPer100g: 26.0,
    note: '1玉 約180g (234kcal)'
  }
];

export function calculateStaplePFC(preset: StaplePreset, amount: number) {
  const actualGrams = preset.gramsPerUnit ? amount * preset.gramsPerUnit : amount;
  const factor = actualGrams / 100;

  return {
    calories: Math.round(preset.caloriesPer100g * factor),
    protein: Math.round(preset.proteinPer100g * factor * 10) / 10,
    fat: Math.round(preset.fatPer100g * factor * 10) / 10,
    carbs: Math.round(preset.carbsPer100g * factor * 10) / 10,
    actualGrams
  };
}
