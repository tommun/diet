/**
 * BMIの計算
 * BMI = 体重(kg) / (身長(m))^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Deurenberg式による体脂肪率(%)の推定計算
 *
 * 体脂肪率(%) = (1.20 × BMI) + (0.23 × 年齢) - (10.8 × 性別) - 5.4
 * ※ 性別: 男性 = 1, 女性 = 0
 */
export function calculateBodyFatPercentage(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' = 'male'
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;

  const bmi = calculateBMI(weightKg, heightCm);
  const genderFactor = gender === 'male' ? 1 : 0;

  // Deurenberg formula
  const bodyFat = 1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4;

  // 妥当な範囲（5%〜60%）にクランプして小数点第1位で丸める
  const clamped = Math.max(5, Math.min(60, bodyFat));
  return Math.round(clamped * 10) / 10;
}
