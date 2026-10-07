import { FoodItem, TargetPFC } from '../types';

export interface RecommendedItem {
  name: string;
  weightGrams?: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecommendedMealPlan {
  id: string;
  title: string;
  tag: 'home' | 'convenience' | 'quick' | 'ai';
  tagLabel: string;
  description: string;
  items: RecommendedItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export interface RecommendationContext {
  target: TargetPFC;
  currentItems: FoodItem[];
  breakfastItems: FoodItem[];
  lunchItems: FoodItem[];
  dinnerItems: FoodItem[];
}

/**
 * 残りPFCと朝昼の食事内容から、ルールベースでおすすめの夕食セットを生成
 */
export function generateDinnerRecommendations(context: RecommendationContext): {
  adviceMessage: string;
  remainingPFC: { calories: number; protein: number; fat: number; carbs: number };
  plans: RecommendedMealPlan[];
} {
  const { target, currentItems } = context;

  // 現時点の摂取合計
  const totals = currentItems.reduce(
    (acc, item) => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.fat += item.fat || 0;
      acc.carbs += item.carbs || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const remaining = {
    calories: Math.max(0, target.calories - totals.calories),
    protein: Math.round((target.protein - totals.protein) * 10) / 10,
    fat: Math.round((target.fat - totals.fat) * 10) / 10,
    carbs: Math.round((target.carbs - totals.carbs) * 10) / 10,
  };

  // アドバイスメッセージの構築
  let adviceMessage = '';
  const isFatOver = remaining.fat <= 5; // 脂質がほぼ上限または超過
  const needHighProtein = remaining.protein >= 30; // タンパク質が30g以上必要
  const needCarbs = remaining.carbs >= 30; // 炭水化物が30g以上必要

  if (isFatOver && needHighProtein) {
    adviceMessage = `朝・昼で脂質がほぼ上限に達しています。夜は「高タンパク・超低脂質（皮なし鶏むね肉、ササミ、ノンオイルツナ等）」を軸に選ぶと理想的です！`;
  } else if (needHighProtein && !isFatOver) {
    adviceMessage = `タンパク質がまだ ${Math.max(0, remaining.protein)}g 不足しています。魚やお肉をメインにしっかりタンパク質を補給しましょう！`;
  } else if (!needHighProtein && needCarbs) {
    adviceMessage = `タンパク質は十分に確保できています！夜は良質な炭水化物（ごはん等）と野菜中心でカロリーを調整しましょう。`;
  } else {
    adviceMessage = `目標カロリーまであと約 ${Math.round(remaining.calories)} kcal。バランスの良い軽めの夕食でフィニッシュがおすすめです。`;
  }

  // 白米の推奨量を計算（残りCarbsの約70%〜80%をごはんで補うと仮定、100g=37.1g C）
  const targetRiceCarbs = Math.max(20, Math.min(120, remaining.carbs > 0 ? remaining.carbs * 0.8 : 30));
  const recommendedRiceGrams = Math.round((targetRiceCarbs / 37.1) * 100 / 10) * 10 || 150;
  const riceP = Math.round((recommendedRiceGrams * 0.025) * 10) / 10;
  const riceF = Math.round((recommendedRiceGrams * 0.003) * 10) / 10;
  const riceC = Math.round((recommendedRiceGrams * 0.371) * 10) / 10;
  const riceCal = Math.round(recommendedRiceGrams * 1.56);

  const plans: RecommendedMealPlan[] = [];

  // ==========================================
  // プラン1: 🍳 自炊・王道ヘルシーセット
  // ==========================================
  if (isFatOver) {
    // 脂質オーバー時：皮なし鶏むね肉 or ササミ
    const meatGrams = Math.max(150, Math.min(250, Math.round((remaining.protein - riceP) / 0.23 / 10) * 10 || 180));
    const meatP = Math.round(meatGrams * 0.233 * 10) / 10;
    const meatF = Math.round(meatGrams * 0.019 * 10) / 10; // 皮なしは約1.9%
    const meatCal = Math.round(meatGrams * 1.16);

    const items1: RecommendedItem[] = [
      {
        name: `鶏むね肉 (皮なしソテー・蒸し)`,
        weightGrams: meatGrams,
        calories: meatCal,
        protein: meatP,
        fat: meatF,
        carbs: 0,
      },
      {
        name: `ごはん (白米)`,
        weightGrams: recommendedRiceGrams,
        calories: riceCal,
        protein: riceP,
        fat: riceF,
        carbs: riceC,
      },
      {
        name: `ブロッコリー・野菜の温野菜サラダ (ノンオイル)`,
        weightGrams: 100,
        calories: 33,
        protein: 4.3,
        fat: 0.5,
        carbs: 5.2,
      },
    ];

    plans.push(createPlan('plan_home', '🍳 究極のPFC調整！皮なし鶏むね肉定食', 'home', '自炊おすすめ', '脂質をほぼゼロに抑えつつ、一食でタンパク質をガッツリ補給できる黄金セット。', items1));
  } else {
    // 脂質に余裕がある時：鮭の塩焼きや豚ヒレ
    const items1: RecommendedItem[] = [
      {
        name: `鮭の塩焼き (切り身1切れ)`,
        weightGrams: 100,
        calories: 133,
        protein: 22.3,
        fat: 4.5,
        carbs: 0.1,
      },
      {
        name: `ごはん (白米)`,
        weightGrams: recommendedRiceGrams,
        calories: riceCal,
        protein: riceP,
        fat: riceF,
        carbs: riceC,
      },
      {
        name: `豆腐とわかめの味噌汁`,
        weightGrams: 160,
        calories: 56,
        protein: 3.8,
        fat: 1.8,
        carbs: 5.5,
      },
      {
        name: `納豆 1パック`,
        weightGrams: 45,
        calories: 86,
        protein: 7.4,
        fat: 4.5,
        carbs: 5.4,
      },
    ];

    plans.push(createPlan('plan_home', '🍳 魚と大豆の和定食セット', 'home', '自炊おすすめ', '良質なオメガ3脂肪酸とタンパク質をバランス良く摂れる理想の和食。', items1));
  }

  // ==========================================
  // プラン2: 🏪 コンビニ・即買いセット
  // ==========================================
  const convItems: RecommendedItem[] = [
    {
      name: `サラダチキン (プレーン 1パック)`,
      weightGrams: 110,
      calories: 115,
      protein: 24.1,
      fat: 1.2,
      carbs: 0.5,
    },
    {
      name: `おにぎり (鮭または梅 1個)`,
      weightGrams: 110,
      calories: 175,
      protein: 4.2,
      fat: 1.1,
      carbs: 37.0,
    },
    {
      name: `味付き半熟ゆで卵 1個`,
      weightGrams: 50,
      calories: 65,
      protein: 6.3,
      fat: 4.3,
      carbs: 0.4,
    },
  ];

  if (remaining.carbs >= 60) {
    convItems.push({
      name: `おにぎり (昆布または塩 2個目)`,
      weightGrams: 110,
      calories: 170,
      protein: 3.5,
      fat: 0.8,
      carbs: 37.5,
    });
  }

  plans.push(createPlan('plan_conv', '🏪 コンビニ即買い！高タンパク低脂質セット', 'convenience', 'コンビニ', 'セブン・ローソン・ファミマで買える、調理不要の手軽なPFC調整セット。', convItems));

  // ==========================================
  // プラン3: ⚡ 超お手軽・時短サプリセット
  // ==========================================
  const quickItems: RecommendedItem[] = [
    {
      name: `ホエイプロテイン (1杯分)`,
      weightGrams: 30,
      calories: 120,
      protein: 24.0,
      fat: 1.5,
      carbs: 3.0,
    },
    {
      name: `バナナ 1本`,
      weightGrams: 100,
      calories: 86,
      protein: 1.1,
      fat: 0.2,
      carbs: 22.5,
    },
    {
      name: `ギリシャヨーグルト (オイコス等 1個)`,
      weightGrams: 113,
      calories: 92,
      protein: 10.1,
      fat: 0,
      carbs: 12.2,
    },
  ];

  if (remaining.protein > 40) {
    quickItems.push({
      name: `カニカマまたはちくわ 1パック`,
      weightGrams: 80,
      calories: 72,
      protein: 9.6,
      fat: 0.4,
      carbs: 7.5,
    });
  }

  plans.push(createPlan('plan_quick', '⚡ 疲れた夜に！火を使わない時短セット', 'quick', 'お手軽・時短', '食欲があまりない時や帰宅が遅い日にも、胃もたれせずPFCを満たせる構成。', quickItems));

  return {
    adviceMessage,
    remainingPFC: remaining,
    plans,
  };
}

function createPlan(
  id: string,
  title: string,
  tag: 'home' | 'convenience' | 'quick' | 'ai',
  tagLabel: string,
  description: string,
  items: RecommendedItem[]
): RecommendedMealPlan {
  const totals = items.reduce(
    (acc, it) => {
      acc.calories += it.calories;
      acc.protein += it.protein;
      acc.fat += it.fat;
      acc.carbs += it.carbs;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return {
    id,
    title,
    tag,
    tagLabel,
    description,
    items,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein * 10) / 10,
    totalFat: Math.round(totals.fat * 10) / 10,
    totalCarbs: Math.round(totals.carbs * 10) / 10,
  };
}

/**
 * Gemini APIを活用したユーザーリクエスト対応型・夕食提案
 */
export async function generateAiDinnerRecommendation(
  apiKey: string,
  context: RecommendationContext,
  userRequest?: string
): Promise<RecommendedMealPlan | null> {
  if (!apiKey || !apiKey.trim()) return null;

  try {
    const { target, currentItems, breakfastItems, lunchItems } = context;

    const bNames = breakfastItems.map(i => `${i.name}(${i.calories}kcal, P:${i.protein}g F:${i.fat}g C:${i.carbs}g)`).join(', ');
    const lNames = lunchItems.map(i => `${i.name}(${i.calories}kcal, P:${i.protein}g F:${i.fat}g C:${i.carbs}g)`).join(', ');

    const currentTotals = currentItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        fat: acc.fat + (item.fat || 0),
        carbs: acc.carbs + (item.carbs || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    const remainingP = Math.round((target.protein - currentTotals.protein) * 10) / 10;
    const remainingF = Math.round((target.fat - currentTotals.fat) * 10) / 10;
    const remainingC = Math.round((target.carbs - currentTotals.carbs) * 10) / 10;
    const remainingCal = Math.round(target.calories - currentTotals.calories);

    const prompt = `
あなたはプロのスポーツ栄養士・PFC管理コーチです。
ユーザーが本日食べた朝食・昼食の実績と、目標達成までの残りPFC枠、そして【ユーザーからの要望・リクエスト】に基づいて、今夜食べるべき最高の夕食メニューセット（1食分）を作成してください。

【ユーザーからの要望・リクエスト】
★「${userRequest && userRequest.trim() ? userRequest.trim() : '特になし（PFC最適化を最優先におまかせ）'}」★
※上記のユーザーリクエスト（例: 食材の指定、コンビニ指定、さっぱり系、時短、自炊など）を最優先で反映してください。

【本日の目標PFC】
- カロリー: ${target.calories} kcal
- タンパク質 (P): ${target.protein} g
- 脂質 (F): ${target.fat} g
- 炭水化物 (C): ${target.carbs} g

【朝食の実績】
${bNames || '未記録'}

【昼食の実績】
${lNames || '未記録'}

【現在の残りPFC枠（今夜摂るべき目安）】
- カロリー: あと約 ${remainingCal} kcal
- タンパク質 (P): あと約 ${remainingP} g
- 脂質 (F): あと約 ${remainingF} g ${remainingF <= 0 ? '(※超過中！極力0g〜極少に抑えてください)' : ''}
- 炭水化物 (C): あと約 ${remainingC} g

【出力形式】
必ず以下の有効なJSON形式のみを出力してください：
{
  "title": "メニューの魅力的なタイトル（例: 【コンビニ】サラダチキンとおにぎりの高タンパクセット）",
  "description": "ユーザーの要望とPFCバランスをどう両立したかの解説コメント（1〜2文）",
  "items": [
    {
      "name": "料理名・食材名（具体的に）",
      "weightGrams": グラム数（数値）,
      "calories": カロリー（kcal、数値）,
      "protein": タンパク質（g、数値）,
      "fat": 脂質（g、数値）,
      "carbs": 炭水化物（g、数値）
    }
  ]
}
`;

    // gemini-2.5-flash または gemini-1.5-flash
    let res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      // フォールバック
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
    }

    if (!res.ok) {
      throw new Error(`Gemini API Error: ${res.status}`);
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // マークダウンコードブロックのクリーンアップ
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    if (!parsed.items || !Array.isArray(parsed.items)) return null;

    return createPlan(
      'plan_ai_' + Date.now(),
      '✨ ' + (parsed.title || 'AIカスタム夕食プラン'),
      'ai',
      'AIシェフ特製',
      parsed.description || '朝昼の食事内容とリクエストに合わせてAIが専用設計した夕食プランです。',
      parsed.items
    );
  } catch (e) {
    console.error('Failed to generate AI dinner recommendation', e);
    return null;
  }
}
