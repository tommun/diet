export interface ExtractedNutrition {
  name?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidenceNote?: string;
}

/**
 * 栄養成分表示の写真（base64）をGemini APIに送信し、
 * カロリー、たんぱく質、脂質、炭水化物を抽出する
 */
export async function extractNutritionFromImage(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedNutrition> {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。右上の設定（歯車アイコン）からAPIキーを登録してください。');
  }

  // base64データ部分のみ取り出し（data:image/jpeg;base64,〜 を剥がす）
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `この画像は食品パッケージの栄養成分表示または食品情報（スクショ/写真）です。
画像から以下の数値を読み取り、JSON形式のみで回答してください。余分な解説文やマークダウンのバッククォート（\`\`\`json）は不要です。

【抽出項目】
1. name: 商品名や料理名（画像から読み取れる場合。分からなければ「成分表示食品」など）
2. calories: エネルギーまたは熱量 (kcal)。数値のみ (例: 245)
3. protein: たんぱく質 (g)。小数点第1位までの数値 (例: 15.2)
4. fat: 脂質 (g)。小数点第1位までの数値 (例: 8.5)
5. carbs: 炭水化物 (g)。※糖質と食物繊維に分かれている場合は「糖質 + 食物繊維」または「炭水化物」を採用。数値のみ (例: 32.0)
6. confidenceNote: 1食あたり/100gあたり等の補足事項（例: "1包装あたり", "100gあたり"）

回答フォーマット例:
{"name": "特製カルボナーラ", "calories": 480, "protein": 18.5, "fat": 21.0, "carbs": 54.2, "confidenceNote": "1包装あたり"}
`;

  // Gemini 2.5 Flash / 1.5 Flash を優先使用
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as any)?.error?.message || `APIリクエストに失敗しました (${response.status})`;
    throw new Error(message);
  }

  const result = await response.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Gemini APIから結果が得られませんでした。');
  }

  try {
    const parsed = JSON.parse(textOutput.trim());
    return {
      name: parsed.name || '記録食品',
      calories: Number(parsed.calories) || 0,
      protein: Math.round((Number(parsed.protein) || 0) * 10) / 10,
      fat: Math.round((Number(parsed.fat) || 0) * 10) / 10,
      carbs: Math.round((Number(parsed.carbs) || 0) * 10) / 10,
      confidenceNote: parsed.confidenceNote || ''
    };
  } catch (err) {
    console.error('JSON Parse error from gemini response:', textOutput, err);
    throw new Error('栄養成分データのパースに失敗しました。');
  }
}
