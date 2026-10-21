import { MealType } from '../types';

export interface ParsedFoodItem {
  id?: string;
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
  source?: 'ai' | 'offline';
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
  apiKey?: string,
  defaultMealType: MealType = 'dinner'
): Promise<ParsedMealGroup[]> {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  // APIキーがある場合はGeminiで高精度パース
  if (apiKey && apiKey.trim()) {
    try {
      const result = await parseWithGemini(trimmed, currentDateStr, apiKey.trim(), defaultMealType);
      if (result && result.length > 0) {
        return result;
      }
    } catch (e) {
      console.warn('Gemini chat parsing failed, falling back to smart local parser:', e);
    }
  }

  // オフライン・スマートパーサー（フォールバック）
  return parseWithLocalRules(trimmed, currentDateStr, defaultMealType);
}

/**
 * Gemini APIを活用した高精度自然言語パース
 * 複数モデルのフォールバックチェーンで高い信頼性を確保
 */
async function parseWithGemini(
  text: string,
  baseDateStr: string,
  apiKey: string,
  defaultMealType: MealType = 'dinner'
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
2. 「朝」「昼」「夜」「晩御飯」「間食」「夜食」などのキーワードから mealType を ("breakfast" | "lunch" | "dinner" | "snack") に分類してください。指定がない場合は「${defaultMealType}」に分類してください。
3. ユーザーが入力した品目（サバの水煮缶、大根おろし、ごはん200g、ノンオイルツナ缶、納豆、豆腐半丁等）は、1つも漏らさず全て個別のアイテムとして分解・抽出してください。
4. 日本食品標準成分表や市販品・外食の公式データを基準に、現実的で高精度な栄養価 (calories, protein, fat, carbs) を算出してください。

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

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-3.8-flash',
  ];

  let rawJson = '';
  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

      if (res.ok) {
        const data = await res.json();
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          rawJson = textResp;
          break;
        }
      }
    } catch {
      // 次のモデルを試行
    }
  }

  if (!rawJson) throw new Error('AIからの応答が得られませんでした。');

  rawJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(rawJson);

  if (!Array.isArray(parsed)) return [];

  return parsed.map((group: any) => {
    const mealType: MealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(group.mealType)
      ? group.mealType
      : defaultMealType;
    const items: ParsedFoodItem[] = Array.isArray(group.items)
      ? group.items.map((i: any, idx: number) => ({
          id: 'item_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
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
      source: 'ai' as const,
    };
  });
}

/**
 * オフライン対応スマートパーサー（強化ルールベース＋拡張食材辞書）
 * 入力された品目を1つも漏らさず全てトークン化して抽出します
 */
function parseWithLocalRules(
  text: string,
  baseDateStr: string,
  defaultMealType: MealType = 'dinner'
): ParsedMealGroup[] {
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

  // 1. 食事区分（朝・昼・夕・間食）を行単位またはキーワードで分割
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections: { mealType: MealType; content: string[] }[] = [];
  let currentMealType: MealType = defaultMealType; // デフォルト

  for (const line of rawLines) {
    let lineMealType: MealType | null = null;
    let cleanLine = line;

    const bMatch = line.match(/^(?:今日の|昨日の|一昨日の)?(?:朝ごはん|朝食|モーニング|朝)[:：\s]?(.*)$/i);
    const lMatch = line.match(/^(?:今日の|昨日の|一昨日の)?(?:昼ごはん|お昼ご飯|お昼|昼食|ランチ|昼)[:：\s]?(.*)$/i);
    const dMatch = line.match(/^(?:今日の|昨日の|一昨日の)?(?:晩御飯|晩ごはん|ばんごはん|夜ごはん|夕食|ディナー|夜|晩)[:：\s]?(.*)$/i);
    const sMatch = line.match(/^(?:今日の|昨日の|一昨日の)?(?:間食|おやつ|夜食|デザート)[:：\s]?(.*)$/i);

    if (bMatch) {
      lineMealType = 'breakfast';
      cleanLine = bMatch[1];
    } else if (lMatch) {
      lineMealType = 'lunch';
      cleanLine = lMatch[1];
    } else if (dMatch) {
      lineMealType = 'dinner';
      cleanLine = dMatch[1];
    } else if (sMatch) {
      lineMealType = 'snack';
      cleanLine = sMatch[1];
    }

    if (lineMealType) {
      currentMealType = lineMealType;
    }

    if (cleanLine && cleanLine.trim()) {
      let existing = sections.find((s) => s.mealType === currentMealType);
      if (!existing) {
        existing = { mealType: currentMealType, content: [] };
        sections.push(existing);
      }
      existing.content.push(cleanLine.trim());
    }
  }

  if (sections.length === 0) {
    sections.push({ mealType: defaultMealType, content: rawLines });
  }

  const results: ParsedMealGroup[] = [];

  for (const sec of sections) {
    // 読点（、）、カンマ（,）、スラッシュ（/）、中黒（・）、プラス（+）等で品目トークンに正確に分割
    const joined = sec.content.join('、');
    const rawTokens = joined
      .split(/[、,\/／+＋・\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const items: ParsedFoodItem[] = [];
    for (let idx = 0; idx < rawTokens.length; idx++) {
      const token = rawTokens[idx];
      const item = parseSingleFoodItem(token, idx);
      if (item) {
        items.push(item);
      }
    }

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
      source: 'offline' as const,
    });
  }

  return results;
}

/**
 * 1品ずつのトークンを判定・推計（サバ缶・ツナ缶・大根おろし・豆腐等に完全対応、未知品目も絶対落とさない）
 */
function parseSingleFoodItem(rawToken: string, index: number): ParsedFoodItem | null {
  const token = rawToken.trim();
  if (!token) return null;

  const id = 'local_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6);

  // 1. グラム数・分量の抽出
  let grams: number | undefined = undefined;
  const gramMatch = token.match(/(\d{2,4})\s*g/i);
  if (gramMatch) {
    grams = parseInt(gramMatch[1], 10);
  }

  // 2. 数量（個、枚、丁、缶、パック、杯等）
  const countMatch = token.match(/(\d+)\s*(個|つ|本|枚|丁|缶|パック|杯|切れ|皿|袋|包)/);
  const count = countMatch ? parseInt(countMatch[1], 10) : 1;

  // --- 判定ロジック（高頻度日常食材） ---

  // サバ・鯖・缶詰
  if (/サバ|さば|鯖/.test(token)) {
    if (/水煮/.test(token) || /缶/.test(token)) {
      const w = grams || 190;
      return {
        id,
        name: `サバの水煮缶 (${w}g)`,
        weightGrams: w,
        calories: Math.round(w * 1.5), // 190gで約285kcal
        protein: Math.round(w * 0.15 * 10) / 10, // 約28.5g
        fat: Math.round(w * 0.10 * 10) / 10, // 約19.0g
        carbs: 0.2,
      };
    } else if (/味噌煮/.test(token)) {
      const w = grams || 150;
      return {
        id,
        name: `サバの味噌煮缶 (${w}g)`,
        weightGrams: w,
        calories: Math.round(w * 2.1),
        protein: Math.round(w * 0.14 * 10) / 10,
        fat: Math.round(w * 0.12 * 10) / 10,
        carbs: 10.5,
      };
    } else {
      const w = grams || 100;
      return {
        id,
        name: `焼きサバ (${w}g)`,
        weightGrams: w,
        calories: Math.round(w * 2.4),
        protein: Math.round(w * 0.20 * 10) / 10,
        fat: Math.round(w * 0.17 * 10) / 10,
        carbs: 0.3,
      };
    }
  }

  // ツナ・シーチキン
  if (/ツナ|シーチキン/.test(token)) {
    if (/ノンオイル|水煮/.test(token)) {
      const w = grams || 70 * count;
      return {
        id,
        name: `ノンオイルツナ缶 (${count}缶・${w}g)`,
        weightGrams: w,
        calories: Math.round(w * 0.69), // 70gで約48kcal
        protein: Math.round(w * 0.16 * 10) / 10, // 70gで約11.2g
        fat: 0.3,
        carbs: 0.1,
      };
    } else {
      const w = grams || 70 * count;
      return {
        id,
        name: `ツナ缶 (オイル・${count}缶)`,
        weightGrams: w,
        calories: Math.round(w * 2.8), // 70gで約196kcal
        protein: Math.round(w * 0.17 * 10) / 10,
        fat: Math.round(w * 0.23 * 10) / 10,
        carbs: 0.1,
      };
    }
  }

  // 大根おろし・大根
  if (/大根おろし/.test(token)) {
    const w = grams || 80;
    return {
      id,
      name: `大根おろし (${w}g)`,
      weightGrams: w,
      calories: 15,
      protein: 0.4,
      fat: 0.1,
      carbs: 3.3,
    };
  } else if (/大根/.test(token)) {
    const w = grams || 100;
    return {
      id,
      name: `大根小鉢 (${w}g)`,
      weightGrams: w,
      calories: 20,
      protein: 0.5,
      fat: 0.1,
      carbs: 4.1,
    };
  }

  // 豆腐・冷奴
  if (/豆腐|冷奴|とうふ/.test(token)) {
    const isHalf = /半丁|半分|1\/2/.test(token);
    const w = grams || (isHalf ? 150 : 300);
    return {
      id,
      name: `豆腐 (${isHalf ? '半丁' : '1丁'}・${w}g)`,
      weightGrams: w,
      calories: Math.round(w * 0.58), // 150g -> 87kcal
      protein: Math.round(w * 0.05 * 10) / 10, // 150g -> 7.5g
      fat: Math.round(w * 0.035 * 10) / 10, // 150g -> 5.2g
      carbs: Math.round(w * 0.018 * 10) / 10,
    };
  }

  // 納豆
  if (/納豆|なっとう/.test(token)) {
    const packs = count || 1;
    return {
      id,
      name: `納豆 (${packs}パック)`,
      weightGrams: packs * 45,
      calories: packs * 86,
      protein: Math.round(packs * 7.4 * 10) / 10,
      fat: Math.round(packs * 4.5 * 10) / 10,
      carbs: Math.round(packs * 5.4 * 10) / 10,
    };
  }

  // 白米・ごはん・米
  if (/ごはん|白米|ライス|お米|米/.test(token)) {
    let w = grams || 150;
    if (/大盛/.test(token)) w = 250;
    if (/小盛|小茶碗/.test(token)) w = 100;
    return {
      id,
      name: `白米ごはん (${w}g)`,
      weightGrams: w,
      calories: Math.round(w * 1.56),
      protein: Math.round(w * 0.025 * 10) / 10,
      fat: Math.round(w * 0.003 * 10) / 10,
      carbs: Math.round(w * 0.371 * 10) / 10,
    };
  }

  // 食パン・トースト
  if (/食パン|トースト/.test(token)) {
    const slices = count || 1;
    return {
      id,
      name: `食パン (${slices}枚)`,
      weightGrams: slices * 60,
      calories: slices * 149,
      protein: slices * 5.3,
      fat: slices * 2.5,
      carbs: slices * 28.0,
    };
  }

  // 目玉焼き・卵
  if (/目玉焼き|卵|たまご|玉子|エッグ/.test(token)) {
    const eggs = count || 1;
    const hasOil = /オイル|油/.test(token);
    return {
      id,
      name: `目玉焼き (${eggs}個${hasOil ? '・オイル' : ''})`,
      weightGrams: eggs * 55,
      calories: eggs * 75 + (hasOil ? 36 : 0),
      protein: Math.round(eggs * 6.2 * 10) / 10,
      fat: Math.round((eggs * 5.0 + (hasOil ? 4.0 : 0)) * 10) / 10,
      carbs: 0.3,
    };
  }

  // 鶏肉 (もも / むね / ささみ)
  if (/もも|鶏もも|チキン/.test(token)) {
    const w = grams || 200;
    return {
      id,
      name: `鶏もも肉ソテー (${w}g)`,
      weightGrams: w,
      calories: Math.round(w * 1.9),
      protein: Math.round(w * 0.166 * 10) / 10,
      fat: Math.round(w * 0.14 * 10) / 10,
      carbs: 0,
    };
  } else if (/むね|胸肉|ささみ|ササミ/.test(token)) {
    const w = grams || 150;
    return {
      id,
      name: `鶏むね肉/ささみ (${w}g)`,
      weightGrams: w,
      calories: Math.round(w * 1.1),
      protein: Math.round(w * 0.23 * 10) / 10,
      fat: Math.round(w * 0.02 * 10) / 10,
      carbs: 0,
    };
  }

  // 鮭・魚・刺身
  if (/鮭|シャケ|サーモン/.test(token)) {
    const w = grams || 80;
    return {
      id,
      name: `焼き鮭 (${w}g)`,
      weightGrams: w,
      calories: 110,
      protein: 18.0,
      fat: 4.0,
      carbs: 0.1,
    };
  } else if (/刺身|マグロ|まぐろ|カツオ/.test(token)) {
    return {
      id,
      name: `お刺身 (${token})`,
      weightGrams: grams || 100,
      calories: 125,
      protein: 24.0,
      fat: 1.5,
      carbs: 0.2,
    };
  }

  // 野菜（小松菜、ブロッコリー、ほうれん草、サラダ等）
  if (/小松菜|ほうれん草|ブロッコリー|キャベツ|サラダ|野菜|トマト|きゅうり/.test(token)) {
    const w = grams || 100;
    return {
      id,
      name: `${token.replace(/[\d\s]+g/g, '').trim() || '野菜小鉢'} (${w}g)`,
      weightGrams: w,
      calories: 25,
      protein: 1.8,
      fat: 0.3,
      carbs: 3.5,
    };
  }

  // 味噌汁・スープ
  if (/味噌汁|みそ汁|あさげ|スープ|コムタン|ミネストローネ/.test(token)) {
    return {
      id,
      name: `${token.trim()} (1杯)`,
      weightGrams: 160,
      calories: 40,
      protein: 2.2,
      fat: 1.0,
      carbs: 5.5,
    };
  }

  // おにぎり
  if (/おにぎり|おむすび/.test(token)) {
    return {
      id,
      name: `${token.trim()} (1個)`,
      weightGrams: 110,
      calories: 180,
      protein: 4.0,
      fat: 1.5,
      carbs: 38.0,
    };
  }

  // プロテイン
  if (/プロテイン/.test(token)) {
    const w = grams || 30;
    return {
      id,
      name: `プロテイン (${w}g)`,
      weightGrams: w,
      calories: 115,
      protein: 23.0,
      fat: 1.5,
      carbs: 2.5,
    };
  }

  // バナナ・果物
  if (/バナナ/.test(token)) {
    return {
      id,
      name: `バナナ (1本)`,
      weightGrams: 100,
      calories: 86,
      protein: 1.1,
      fat: 0.2,
      carbs: 22.5,
    };
  }

  // うどん・そば・パスタ
  if (/うどん/.test(token)) {
    const w = grams || 200;
    return {
      id,
      name: `うどん (${w}g)`,
      weightGrams: w,
      calories: 210,
      protein: 5.2,
      fat: 0.8,
      carbs: 45.0,
    };
  }

  // カレー・外食
  if (/カレー|coco壱|ココイチ/.test(token)) {
    return {
      id,
      name: `${token.trim()}`,
      weightGrams: 450,
      calories: 780,
      protein: 16.0,
      fat: 20.0,
      carbs: 130.0,
    };
  }

  // 唐揚げ・揚げ物
  if (/唐揚げ|から揚げ|かつ|カツ/.test(token)) {
    return {
      id,
      name: `${token.trim()}`,
      weightGrams: 120,
      calories: 280,
      protein: 16.0,
      fat: 18.0,
      carbs: 12.0,
    };
  }

  // 未知の品目：絶対に消さずに品目として維持する
  return {
    id,
    name: token.trim(),
    weightGrams: grams || 100,
    calories: 120,
    protein: 6.0,
    fat: 3.5,
    carbs: 16.0,
  };
}
