import { MealType } from '../types';

export interface ParsedFoodItem {
  name: string;
  weightGrams?: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ParsedMealGroup {
  date: string; // YYYY-MM-DD
  mealType: MealType;
  mealTypeLabel: string;
  items: ParsedFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食・夜食',
};

/**
 * 自然言語テキストから日付・食事区分・品目・PFCを抽出するメイン関数
 */
export async function parseMealChatText(
  text: string,
  currentDateStr: string,
  apiKey?: string
): Promise<ParsedMealGroup[]> {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  // APIキーがある場合はGeminiで高精度パース
  if (apiKey && apiKey.trim()) {
    try {
      const result = await parseWithGemini(trimmed, currentDateStr, apiKey.trim());
      if (result && result.length > 0) {
        return result;
      }
    } catch (e) {
      console.warn('Gemini chat parsing failed, falling back to smart local parser:', e);
    }
  }

  // オフライン・スマートパーサー（フォールバック）
  return parseWithLocalRules(trimmed, currentDateStr);
}

/**
 * Gemini APIを活用した高精度自然言語パース
 */
async function parseWithGemini(
  text: string,
  baseDateStr: string,
  apiKey: string
): Promise<ParsedMealGroup[]> {
  const prompt = `
あなたはプロの管理栄養士・PFC解析AIです。
ユーザーが入力した日々の食事記録チャットメッセージから、食事区分（朝食・昼食・夕食・間食/夜食）と日付ごとに自動分類し、各食品のカロリー・タンパク質・脂質・炭水化物を正確に推計してJSON形式で出力してください。

【基準日付（今日）】: ${baseDateStr}

【ユーザーの入力テキスト】:
"""
${text}
"""

【解析ルール】:
1. 「今日」「昨日」「一昨日」「10月8日」などの日付表現を解釈し、"YYYY-MM-DD"形式の日付を割り当ててください。省略されている場合は基準日付(${baseDateStr})としてください。
2. 「朝」「昼」「夜」「晩御飯」「間食」「夜食」などのキーワードから mealType を ("breakfast" | "lunch" | "dinner" | "snack") に分類してください。指定がない場合は文脈や時刻から推測してください。
3. 料理名、コンビニ商品名、外食チェーン店名（CoCo壱、セブンイレブン、つるとんたん等）、食材と分量（例: ごはん180g、目玉焼き2個、鶏もも250g）を個別の食品アイテムに分解してください。
4. 日本食品標準成分表や公式外食メニュー数値を基準に、現実的で高精度な栄養価 (calories, protein, fat, carbs) を算出してください。

【出力形式】:
必ず以下の構造を持つJSON配列のみを出力してください（Markdownコードブロック不要）:
[
  {
    "date": "YYYY-MM-DD",
    "mealType": "breakfast" | "lunch" | "dinner" | "snack",
    "items": [
      {
        "name": "食品・料理名 (具体的に)",
        "weightGrams": グラム数 (数値、不明なら概算),
        "calories": カロリー (kcal、数値),
        "protein": タンパク質 (g、数値),
        "fat": 脂質 (g、数値),
        "carbs": 炭水化物 (g、数値)
      }
    ]
  }
]
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API Error: HTTP ${res.status}`);
  }

  const data = await res.json();
  let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) throw new Error('No response from AI');

  rawJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(rawJson);

  if (!Array.isArray(parsed)) return [];

  return parsed.map((group: any) => {
    const mealType: MealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(group.mealType)
      ? group.mealType
      : 'lunch';
    const items: ParsedFoodItem[] = Array.isArray(group.items)
      ? group.items.map((i: any) => ({
          name: String(i.name || '食品'),
          weightGrams: Number(i.weightGrams) || undefined,
          calories: Math.round(Number(i.calories) || 0),
          protein: Math.round((Number(i.protein) || 0) * 10) / 10,
          fat: Math.round((Number(i.fat) || 0) * 10) / 10,
          carbs: Math.round((Number(i.carbs) || 0) * 10) / 10,
        }))
      : [];

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    return {
      date: String(group.date || baseDateStr),
      mealType,
      mealTypeLabel: MEAL_TYPE_LABELS[mealType] || '食事',
      items,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalFat: Math.round(totals.fat * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
    };
  });
}

/**
 * オフライン対応スマートパーサー（ルールベース＋内蔵辞書）
 */
function parseWithLocalRules(text: string, baseDateStr: string): ParsedMealGroup[] {
  // 日付の判定
  let targetDate = baseDateStr;
  if (text.includes('昨日')) {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() - 1);
    targetDate = d.toISOString().split('T')[0];
  } else if (text.includes('一昨日') || text.includes('おととい')) {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() - 2);
    targetDate = d.toISOString().split('T')[0];
  }

  // 朝・昼・夕・夜食・間食のセクション分割
  const sections: { mealType: MealType; content: string }[] = [];
  const lines = text.split(/[\n,、。]/).map((l) => l.trim()).filter(Boolean);

  let currentMealType: MealType = 'lunch'; // デフォルト

  // テキスト全体にどの食事が含まれているか走査
  for (const line of lines) {
    if (line.includes('朝ごはん') || line.includes('朝食') || line.includes('朝')) {
      currentMealType = 'breakfast';
    } else if (line.includes('昼ごはん') || line.includes('昼食') || line.includes('昼') || line.includes('ランチ')) {
      currentMealType = 'lunch';
    } else if (line.includes('夜食')) {
      currentMealType = 'snack';
    } else if (line.includes('晩御飯') || line.includes('夜ごはん') || line.includes('夕食') || line.includes('夜') || line.includes('晩')) {
      currentMealType = 'dinner';
    } else if (line.includes('間食') || line.includes('おやつ') || line.includes('デザート')) {
      currentMealType = 'snack';
    }

    let existing = sections.find((s) => s.mealType === currentMealType);
    if (!existing) {
      existing = { mealType: currentMealType, content: '' };
      sections.push(existing);
    }
    existing.content += ' ' + line;
  }

  if (sections.length === 0) {
    sections.push({ mealType: 'lunch', content: text });
  }

  const results: ParsedMealGroup[] = [];

  for (const sec of sections) {
    const items = extractItemsFromText(sec.content);
    if (items.length === 0) continue;

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    results.push({
      date: targetDate,
      mealType: sec.mealType,
      mealTypeLabel: MEAL_TYPE_LABELS[sec.mealType],
      items,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalFat: Math.round(totals.fat * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
    });
  }

  return results;
}

/**
 * テキストから個々の食品を抽出・推計するサブパーサー
 */
function extractItemsFromText(content: string): ParsedFoodItem[] {
  const items: ParsedFoodItem[] = [];
  const text = content.toLowerCase();

  // 1. 白米・ごはん
  const riceMatch = text.match(/ごはん|白米|ライス/);
  if (riceMatch) {
    const gramMatch = text.match(/(\d{2,3})\s*g/);
    let grams = gramMatch ? parseInt(gramMatch[1], 10) : 150;
    if (text.includes('大盛')) grams = 250;
    if (text.includes('小盛')) grams = 100;
    items.push({
      name: `白米ごはん (${grams}g)`,
      weightGrams: grams,
      calories: Math.round(grams * 1.56),
      protein: Math.round(grams * 0.025 * 10) / 10,
      fat: Math.round(grams * 0.003 * 10) / 10,
      carbs: Math.round(grams * 0.371 * 10) / 10,
    });
  }

  // 2. 食パン
  if (text.includes('食パン') || text.includes('トースト')) {
    const sliceCount = text.includes('2枚') ? 2 : 1;
    items.push({
      name: `食パン (${sliceCount}枚)`,
      weightGrams: sliceCount * 60,
      calories: sliceCount * 149,
      protein: sliceCount * 5.3,
      fat: sliceCount * 2.5,
      carbs: sliceCount * 28.0,
    });
  }

  // 3. 目玉焼き・卵
  if (text.includes('目玉焼き') || text.includes('卵') || text.includes('たまご')) {
    const count = text.includes('2個') || text.includes('2つ') ? 2 : text.includes('3個') ? 3 : 1;
    const hasOil = text.includes('オリーブオイル') || text.includes('オイル') || text.includes('油');
    items.push({
      name: `目玉焼き (${count}個${hasOil ? '・オイル' : ''})`,
      weightGrams: count * 55,
      calories: count * 75 + (hasOil ? 36 : 0),
      protein: Math.round(count * 6.2 * 10) / 10,
      fat: Math.round((count * 5.0 + (hasOil ? 4.0 : 0)) * 10) / 10,
      carbs: 0.3,
    });
  }

  // 4. 鶏肉 (もも / むね / ササミ)
  if (text.includes('もも') || text.includes('鶏もも') || text.includes('チキン')) {
    const gramMatch = text.match(/(\d{2,3})\s*g/);
    const grams = gramMatch ? parseInt(gramMatch[1], 10) : 200;
    items.push({
      name: `鶏もも肉ソテー (${grams}g)`,
      weightGrams: grams,
      calories: Math.round(grams * 1.9),
      protein: Math.round(grams * 0.166 * 10) / 10,
      fat: Math.round(grams * 0.14 * 10) / 10,
      carbs: 0,
    });
  } else if (text.includes('むね') || text.includes('胸肉')) {
    const gramMatch = text.match(/(\d{2,3})\s*g/);
    const grams = gramMatch ? parseInt(gramMatch[1], 10) : 200;
    items.push({
      name: `鶏むね肉ソテー (${grams}g)`,
      weightGrams: grams,
      calories: Math.round(grams * 1.16),
      protein: Math.round(grams * 0.233 * 10) / 10,
      fat: Math.round(grams * 0.019 * 10) / 10,
      carbs: 0,
    });
  }

  // 5. おにぎり
  if (text.includes('おにぎり') || text.includes('おむすび')) {
    items.push({
      name: 'コンビニおにぎり (1個)',
      weightGrams: 110,
      calories: 180,
      protein: 4.0,
      fat: 1.5,
      carbs: 38.0,
    });
  }

  // 6. 冷奴・豆腐
  if (text.includes('冷奴') || text.includes('豆腐')) {
    items.push({
      name: '冷奴 (生姜醤油・150g)',
      weightGrams: 150,
      calories: 84,
      protein: 7.4,
      fat: 4.5,
      carbs: 2.7,
    });
  }

  // 7. 納豆
  if (text.includes('納豆')) {
    items.push({
      name: '納豆 (1パック)',
      weightGrams: 45,
      calories: 86,
      protein: 7.4,
      fat: 4.5,
      carbs: 5.4,
    });
  }

  // 8. 味噌汁・スープ
  if (text.includes('味噌汁') || text.includes('あさげ') || text.includes('スープ')) {
    items.push({
      name: 'お味噌汁・スープ (1杯)',
      weightGrams: 160,
      calories: 35,
      protein: 2.0,
      fat: 0.8,
      carbs: 4.5,
    });
  }

  // 9. 小松菜・野菜・サラダ
  if (text.includes('小松菜') || text.includes('サラダ') || text.includes('野菜')) {
    items.push({
      name: '小松菜・野菜の小鉢',
      weightGrams: 100,
      calories: 25,
      protein: 1.8,
      fat: 0.3,
      carbs: 3.5,
    });
  }

  // 10. カレー
  if (text.includes('カレー') || text.includes('coco壱') || text.includes('ココイチ')) {
    items.push({
      name: 'ポークカレー (大盛り)',
      weightGrams: 550,
      calories: 850,
      protein: 15.0,
      fat: 22.0,
      carbs: 150.0,
    });
  }

  // マッチが全くない場合のフォールバック（一般的な1食）
  if (items.length === 0) {
    items.push({
      name: content.substring(0, 30),
      weightGrams: 200,
      calories: 350,
      protein: 15.0,
      fat: 10.0,
      carbs: 45.0,
    });
  }

  return items;
}
