import { RecipeDish, Ingredient } from '../types';

export const POPULAR_DISH_RECIPES: RecipeDish[] = [
  {
    id: 'carbonara',
    name: 'カルボナーラ',
    category: 'パスタ・麺類',
    description: '標準的な1人前レシピ（パスタ100g、卵、ベーコン、粉チーズ、オリーブオイル）',
    ingredients: [
      {
        name: 'スパゲティ（乾麺）',
        amountGrams: 100,
        unitName: 'g',
        calories: 347,
        protein: 13.0,
        fat: 2.0,
        carbs: 72.0,
        basePer100g: { calories: 347, protein: 13.0, fat: 2.0, carbs: 72.0 }
      },
      {
        name: 'ハーフベーコン',
        amountGrams: 35,
        unitName: 'g',
        calories: 142,
        protein: 4.5,
        fat: 13.5,
        carbs: 0.1,
        basePer100g: { calories: 405, protein: 12.9, fat: 38.5, carbs: 0.3 }
      },
      {
        name: '卵（全卵 1個）',
        amountGrams: 50,
        unitName: 'g',
        calories: 71,
        protein: 6.2,
        fat: 5.2,
        carbs: 0.2,
        basePer100g: { calories: 142, protein: 12.4, fat: 10.4, carbs: 0.4 }
      },
      {
        name: '粉チーズ（パルメザン）',
        amountGrams: 15,
        unitName: 'g',
        calories: 67,
        protein: 6.6,
        fat: 4.6,
        carbs: 0.2,
        basePer100g: { calories: 445, protein: 44.0, fat: 30.8, carbs: 1.5 }
      },
      {
        name: 'オリーブオイル',
        amountGrams: 6,
        unitName: 'g',
        calories: 54,
        protein: 0,
        fat: 6.0,
        carbs: 0,
        basePer100g: { calories: 900, protein: 0, fat: 100.0, carbs: 0 }
      }
    ]
  },
  {
    id: 'oyakodon',
    name: '親子丼',
    category: '丼もの・ご飯もの',
    description: '標準的な1人前（白米200g、鶏もも肉80g、卵2個、玉ねぎ、出汁調味料）',
    ingredients: [
      {
        name: 'ご飯（白米）',
        amountGrams: 200,
        unitName: 'g',
        calories: 312,
        protein: 5.0,
        fat: 0.6,
        carbs: 74.2,
        basePer100g: { calories: 156, protein: 2.5, fat: 0.3, carbs: 37.1 }
      },
      {
        name: '鶏もも肉（皮なし）',
        amountGrams: 80,
        unitName: 'g',
        calories: 93,
        protein: 16.0,
        fat: 3.2,
        carbs: 0,
        basePer100g: { calories: 116, protein: 20.0, fat: 4.0, carbs: 0 }
      },
      {
        name: '卵（2個分）',
        amountGrams: 100,
        unitName: 'g',
        calories: 142,
        protein: 12.4,
        fat: 10.4,
        carbs: 0.4,
        basePer100g: { calories: 142, protein: 12.4, fat: 10.4, carbs: 0.4 }
      },
      {
        name: '玉ねぎ',
        amountGrams: 50,
        unitName: 'g',
        calories: 17,
        protein: 0.5,
        fat: 0.1,
        carbs: 4.2,
        basePer100g: { calories: 33, protein: 1.0, fat: 0.1, carbs: 8.4 }
      },
      {
        name: '味付け調味料（醤油・みりん・酒）',
        amountGrams: 25,
        unitName: 'g',
        calories: 45,
        protein: 1.2,
        fat: 0,
        carbs: 8.5,
        basePer100g: { calories: 180, protein: 4.8, fat: 0, carbs: 34.0 }
      }
    ]
  },
  {
    id: 'gyudon',
    name: '牛丼',
    category: '丼もの・ご飯もの',
    description: '標準的な1人前（白米250g、牛バラ肉80g、玉ねぎ60g、甘辛タレ）',
    ingredients: [
      {
        name: 'ご飯（白米）',
        amountGrams: 250,
        unitName: 'g',
        calories: 390,
        protein: 6.3,
        fat: 0.8,
        carbs: 92.8,
        basePer100g: { calories: 156, protein: 2.5, fat: 0.3, carbs: 37.1 }
      },
      {
        name: '牛バラ薄切り肉',
        amountGrams: 80,
        unitName: 'g',
        calories: 297,
        protein: 9.8,
        fat: 28.0,
        carbs: 0.2,
        basePer100g: { calories: 371, protein: 12.3, fat: 35.0, carbs: 0.2 }
      },
      {
        name: '玉ねぎ',
        amountGrams: 60,
        unitName: 'g',
        calories: 20,
        protein: 0.6,
        fat: 0.1,
        carbs: 5.0,
        basePer100g: { calories: 33, protein: 1.0, fat: 0.1, carbs: 8.4 }
      },
      {
        name: '牛丼のタレ（醤油・砂糖・酒）',
        amountGrams: 30,
        unitName: 'g',
        calories: 55,
        protein: 1.5,
        fat: 0,
        carbs: 11.0,
        basePer100g: { calories: 183, protein: 5.0, fat: 0, carbs: 36.7 }
      }
    ]
  },
  {
    id: 'curry_rice',
    name: 'ポークカレーライス',
    category: 'カレー・洋食',
    description: '標準的な1人前（白米250g、豚こま肉70g、じゃがいも・玉ねぎ・人参、カレールー）',
    ingredients: [
      {
        name: 'ご飯（白米）',
        amountGrams: 250,
        unitName: 'g',
        calories: 390,
        protein: 6.3,
        fat: 0.8,
        carbs: 92.8,
        basePer100g: { calories: 156, protein: 2.5, fat: 0.3, carbs: 37.1 }
      },
      {
        name: '豚こま切れ肉',
        amountGrams: 70,
        unitName: 'g',
        calories: 165,
        protein: 13.5,
        fat: 12.0,
        carbs: 0.1,
        basePer100g: { calories: 236, protein: 19.3, fat: 17.1, carbs: 0.2 }
      },
      {
        name: 'カレールー（市販1皿分）',
        amountGrams: 20,
        unitName: 'g',
        calories: 102,
        protein: 1.4,
        fat: 7.2,
        carbs: 8.4,
        basePer100g: { calories: 510, protein: 7.0, fat: 36.0, carbs: 42.0 }
      },
      {
        name: 'じゃがいも・人参・玉ねぎ',
        amountGrams: 100,
        unitName: 'g',
        calories: 52,
        protein: 1.2,
        fat: 0.1,
        carbs: 12.0,
        basePer100g: { calories: 52, protein: 1.2, fat: 0.1, carbs: 12.0 }
      },
      {
        name: '炒め油',
        amountGrams: 5,
        unitName: 'g',
        calories: 45,
        protein: 0,
        fat: 5.0,
        carbs: 0,
        basePer100g: { calories: 900, protein: 0, fat: 100.0, carbs: 0 }
      }
    ]
  },
  {
    id: 'ginger_pork',
    name: '豚の生姜焼き（おかずのみ）',
    category: '肉料理・和食',
    description: '標準的な1人前（豚ロース肉120g、玉ねぎ50g、生姜醤油ダレ、油）',
    ingredients: [
      {
        name: '豚ロース薄切り肉',
        amountGrams: 120,
        unitName: 'g',
        calories: 271,
        protein: 23.2,
        fat: 19.4,
        carbs: 0.2,
        basePer100g: { calories: 226, protein: 19.3, fat: 16.2, carbs: 0.2 }
      },
      {
        name: '玉ねぎ',
        amountGrams: 50,
        unitName: 'g',
        calories: 17,
        protein: 0.5,
        fat: 0.1,
        carbs: 4.2,
        basePer100g: { calories: 33, protein: 1.0, fat: 0.1, carbs: 8.4 }
      },
      {
        name: '生姜焼きタレ（醤油・みりん・酒・砂糖・生姜）',
        amountGrams: 25,
        unitName: 'g',
        calories: 42,
        protein: 1.5,
        fat: 0.1,
        carbs: 8.0,
        basePer100g: { calories: 168, protein: 6.0, fat: 0.4, carbs: 32.0 }
      },
      {
        name: 'サラダ油',
        amountGrams: 5,
        unitName: 'g',
        calories: 45,
        protein: 0,
        fat: 5.0,
        carbs: 0,
        basePer100g: { calories: 900, protein: 0, fat: 100.0, carbs: 0 }
      }
    ]
  },
  {
    id: 'hamburg_steak',
    name: 'ハンバーグ（デミグラス）',
    category: '肉料理・洋食',
    description: '標準的な1個分（合挽き肉100g、玉ねぎ、パン粉、牛乳、卵、デミソース）',
    ingredients: [
      {
        name: '牛豚合挽き肉',
        amountGrams: 100,
        unitName: 'g',
        calories: 224,
        protein: 17.1,
        fat: 17.2,
        carbs: 0.3,
        basePer100g: { calories: 224, protein: 17.1, fat: 17.2, carbs: 0.3 }
      },
      {
        name: '玉ねぎ（みじん切り）',
        amountGrams: 40,
        unitName: 'g',
        calories: 13,
        protein: 0.4,
        fat: 0.1,
        carbs: 3.4,
        basePer100g: { calories: 33, protein: 1.0, fat: 0.1, carbs: 8.4 }
      },
      {
        name: 'つなぎ（パン粉・牛乳・卵1/4個）',
        amountGrams: 25,
        unitName: 'g',
        calories: 55,
        protein: 2.2,
        fat: 1.8,
        carbs: 7.5,
        basePer100g: { calories: 220, protein: 8.8, fat: 7.2, carbs: 30.0 }
      },
      {
        name: 'デミグラスソース',
        amountGrams: 30,
        unitName: 'g',
        calories: 36,
        protein: 0.9,
        fat: 1.8,
        carbs: 4.2,
        basePer100g: { calories: 120, protein: 3.0, fat: 6.0, carbs: 14.0 }
      },
      {
        name: '焼き油',
        amountGrams: 5,
        unitName: 'g',
        calories: 45,
        protein: 0,
        fat: 5.0,
        carbs: 0,
        basePer100g: { calories: 900, protein: 0, fat: 100.0, carbs: 0 }
      }
    ]
  },
  {
    id: 'karaage',
    name: '鶏の唐揚げ（3〜4個）',
    category: '肉料理・揚げ物',
    description: '標準的な1人前（鶏もも肉120g、片栗粉、下味、揚げ油吸収分）',
    ingredients: [
      {
        name: '鶏もも肉（皮付き）',
        amountGrams: 120,
        unitName: 'g',
        calories: 240,
        protein: 20.0,
        fat: 17.0,
        carbs: 0,
        basePer100g: { calories: 200, protein: 16.6, fat: 14.2, carbs: 0 }
      },
      {
        name: '片栗粉（衣）',
        amountGrams: 15,
        unitName: 'g',
        calories: 50,
        protein: 0.1,
        fat: 0,
        carbs: 12.3,
        basePer100g: { calories: 330, protein: 0.7, fat: 0.1, carbs: 82.0 }
      },
      {
        name: '下味（醤油・酒・にんにく生姜）',
        amountGrams: 15,
        unitName: 'g',
        calories: 18,
        protein: 1.0,
        fat: 0,
        carbs: 2.5,
        basePer100g: { calories: 120, protein: 6.7, fat: 0, carbs: 16.7 }
      },
      {
        name: '吸油量（揚げ油）',
        amountGrams: 10,
        unitName: 'g',
        calories: 90,
        protein: 0,
        fat: 10.0,
        carbs: 0,
        basePer100g: { calories: 900, protein: 0, fat: 100.0, carbs: 0 }
      }
    ]
  },
  {
    id: 'saba_shioyaki',
    name: 'サバの塩焼き（1切れ）',
    category: '魚料理・和食',
    description: '標準的な切り身（サバ100g、塩）良質な脂質と高タンパク',
    ingredients: [
      {
        name: 'サバ（生・切り身）',
        amountGrams: 100,
        unitName: 'g',
        calories: 247,
        protein: 20.6,
        fat: 16.8,
        carbs: 0.3,
        basePer100g: { calories: 247, protein: 20.6, fat: 16.8, carbs: 0.3 }
      },
      {
        name: '食塩',
        amountGrams: 1,
        unitName: 'g',
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        basePer100g: { calories: 0, protein: 0, fat: 0, carbs: 0 }
      }
    ]
  }
];

/**
 * グラム数変更に伴う材料のPFC再計算
 */
export function recalculateIngredient(
  ing: Ingredient,
  newGrams: number
): Ingredient {
  const base = ing.basePer100g || {
    calories: (ing.calories / (ing.amountGrams || 100)) * 100,
    protein: (ing.protein / (ing.amountGrams || 100)) * 100,
    fat: (ing.fat / (ing.amountGrams || 100)) * 100,
    carbs: (ing.carbs / (ing.amountGrams || 100)) * 100,
  };

  const factor = Math.max(0, newGrams) / 100;
  return {
    ...ing,
    amountGrams: newGrams,
    calories: Math.round(base.calories * factor),
    protein: Math.round(base.protein * factor * 10) / 10,
    fat: Math.round(base.fat * factor * 10) / 10,
    carbs: Math.round(base.carbs * factor * 10) / 10,
    basePer100g: base,
  };
}

/**
 * 材料リストから料理全体の合計PFCを計算
 */
export function sumRecipeIngredients(ingredients: Ingredient[]) {
  const total = ingredients.reduce(
    (acc, cur) => {
      acc.calories += cur.calories || 0;
      acc.protein += cur.protein || 0;
      acc.fat += cur.fat || 0;
      acc.carbs += cur.carbs || 0;
      acc.weightGrams += cur.amountGrams || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0, weightGrams: 0 }
  );

  return {
    calories: total.calories,
    protein: Math.round(total.protein * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    weightGrams: Math.round(total.weightGrams),
  };
}
