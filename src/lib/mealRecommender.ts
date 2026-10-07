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
 * APIキー不要！ユーザーの自由リクエストと残りPFCから即座に最適なメニューを作り直すエンジン
 */
export function generateCustomDinnerRecommendation(
  context: RecommendationContext,
  userRequest: string
): RecommendedMealPlan {
  const { target, currentItems } = context;

  const currentTotals = currentItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      fat: acc.fat + (item.fat || 0),
      carbs: acc.carbs + (item.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const remainingP = Math.max(10, Math.round((target.protein - currentTotals.protein) * 10) / 10);
  const remainingF = Math.round((target.fat - currentTotals.fat) * 10) / 10;
  const remainingC = Math.max(10, Math.round((target.carbs - currentTotals.carbs) * 10) / 10);
  const isFatOver = remainingF <= 5;

  const rawReq = userRequest || '';
  const req = rawReq.toLowerCase();

  // ごはんの基本量（適正上限250g、下限100g）
  const riceGrams = Math.min(250, Math.max(100, Math.round((remainingC / 0.371) / 10) * 10 || 150));
  const riceItem: RecommendedItem = {
    name: '白米ごはん',
    weightGrams: riceGrams,
    calories: Math.round(riceGrams * 1.56),
    protein: Math.round(riceGrams * 0.025 * 10) / 10,
    fat: Math.round(riceGrams * 0.003 * 10) / 10,
    carbs: Math.round(riceGrams * 0.371 * 10) / 10,
  };

  // 温野菜小鉢
  const vegItem: RecommendedItem = {
    name: 'キノコとブロッコリーの温野菜 (ノンオイルポン酢)',
    weightGrams: 120,
    calories: 36,
    protein: 4.0,
    fat: 0.5,
    carbs: 5.5,
  };

  // サブ品目のスマート補填関数（1食で肉を400g〜500gドカ食いせず、副菜やプロテインに分散）
  const balanceSubItems = (currentP: number): RecommendedItem[] => {
    const subItems: RecommendedItem[] = [];
    let neededP = remainingP - currentP;

    // 卵（温泉卵または味玉）
    if (neededP >= 6) {
      subItems.push({
        name: '温泉卵 または 味付き半熟卵 (1個)',
        weightGrams: 50,
        calories: 65,
        protein: 6.3,
        fat: 4.3,
        carbs: 0.4,
      });
      neededP -= 6.3;
    }

    // 冷奴または納豆
    if (neededP >= 7) {
      subItems.push({
        name: isFatOver ? '冷奴 (生姜醤油・ネギ 1/2丁)' : '納豆 (1パック)',
        weightGrams: isFatOver ? 150 : 45,
        calories: isFatOver ? 84 : 86,
        protein: 7.4,
        fat: 4.5,
        carbs: isFatOver ? 2.7 : 5.4,
      });
      neededP -= 7.4;
    }

    // それでもなおタンパク質が大幅に不足（残り20g以上ある場合）：夜または就寝前のプロテイン
    if (neededP >= 18) {
      subItems.push({
        name: 'ホエイプロテイン (食後または就寝前用 1杯)',
        weightGrams: 30,
        calories: 120,
        protein: 24.0,
        fat: 1.5,
        carbs: 3.0,
      });
    }

    return subItems;
  };

  // =========================================================
  // 1. 食材キーワードのターゲット検出
  // 「鶏むねを鶏ももに変更」などのリクエストでは「もも」を最優先で検出！
  // =========================================================

  // (A) 鶏もも肉（「もも」「モモ」）
  if (req.includes('もも') || req.includes('モモ')) {
    const meatGrams = Math.min(220, Math.max(150, Math.round((remainingP / 0.188) / 10) * 10 || 200));
    const mainMeat: RecommendedItem = isFatOver
      ? {
          name: `皮なし鶏もも肉 (ジューシー塩コショウソテー)`,
          weightGrams: meatGrams,
          calories: Math.round(meatGrams * 1.16),
          protein: Math.round(meatGrams * 0.188 * 10) / 10,
          fat: Math.round(meatGrams * 0.039 * 10) / 10,
          carbs: 0,
        }
      : {
          name: `鶏もも肉の香ばし照り焼き (または塩焼き)`,
          weightGrams: meatGrams,
          calories: Math.round(meatGrams * 1.90),
          protein: Math.round(meatGrams * 0.166 * 10) / 10,
          fat: Math.round(meatGrams * 0.140 * 10) / 10,
          carbs: 2.0,
        };

    const currentP = mainMeat.protein + riceItem.protein + vegItem.protein;
    const subItems = balanceSubItems(currentP);

    const items = [mainMeat, riceItem, vegItem, ...subItems];
    return createPlan(
      'plan_custom_' + Date.now(),
      '🍗 【リクエスト対応】皮なし鶏もも肉のジューシー高タンパク定食',
      'home',
      '鶏ももリクエスト',
      `「${rawReq}」のご要望に合わせて、鶏もも肉を採用！${isFatOver ? '皮を外すことで脂質を70%カットし、ジューシーさを保ちつつPFC枠ジャストに仕上げました。' : '食べ応え抜群のジューシーな鶏もも肉でPFCをしっかり充足させます。'}${subItems.length > 0 ? '（不足分のタンパク質は小鉢やプロテインで無理なく補填）' : ''}`,
      items
    );
  }

  // (B) 鶏ササミ（「ささみ」「ササミ」）
  if (req.includes('ササミ') || req.includes('ささみ')) {
    const meatGrams = Math.min(200, Math.max(120, Math.round((remainingP / 0.239) / 10) * 10 || 160));
    const mainMeat: RecommendedItem = {
      name: '鶏ささみの梅大葉焼き (またはレモンペッパーソテー)',
      weightGrams: meatGrams,
      calories: Math.round(meatGrams * 1.05),
      protein: Math.round(meatGrams * 0.239 * 10) / 10,
      fat: Math.round(meatGrams * 0.008 * 10) / 10,
      carbs: 0.5,
    };

    const currentP = mainMeat.protein + riceItem.protein + vegItem.protein;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🌿 【リクエスト対応】超低脂質！鶏ささみの梅大葉焼き定食',
      'home',
      'ささみリクエスト',
      `ササミのご指定に合わせ、脂質ほぼゼロ・タンパク質超高純度のヘルシー献立を構成しました！`,
      [mainMeat, riceItem, vegItem, ...subItems]
    );
  }

  // (C) 牛肉・ステーキ（「牛」「ステーキ」「ビーフ」）
  if (req.includes('牛') || req.includes('ステーキ') || req.includes('ビーフ')) {
    const meatGrams = Math.min(200, Math.max(150, Math.round((remainingP / 0.21) / 10) * 10 || 180));
    const mainMeat: RecommendedItem = {
      name: '牛赤身肉のステーキ (ヒレまたはランプ赤身・和風オニオンソース)',
      weightGrams: meatGrams,
      calories: Math.round(meatGrams * 1.30),
      protein: Math.round(meatGrams * 0.21 * 10) / 10,
      fat: Math.round(meatGrams * 0.045 * 10) / 10,
      carbs: 1.5,
    };

    const currentP = mainMeat.protein + riceItem.protein + vegItem.protein;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🥩 【リクエスト対応】鉄分＆亜鉛チャージ！牛赤身ステーキ定食',
      'home',
      '牛肉リクエスト',
      `牛肉のご要望に合わせて、脂質の少ない良質な牛ヒレ・ランプ赤身肉を厳選。クレアチンや鉄分も豊富に摂れるパワフルな夕食です！`,
      [mainMeat, riceItem, vegItem, ...subItems]
    );
  }

  // (D) 豚肉・豚ヒレ・生姜焼き（「豚」「ポーク」「ヒレ」「生姜焼き」）
  if (req.includes('豚') || req.includes('ポーク') || req.includes('生姜焼')) {
    const meatGrams = Math.min(200, Math.max(150, Math.round((remainingP / 0.228) / 10) * 10 || 180));
    const mainMeat: RecommendedItem = {
      name: '豚ヒレ肉のソテー (またはノンオイル豚生姜焼き)',
      weightGrams: meatGrams,
      calories: Math.round(meatGrams * 1.15),
      protein: Math.round(meatGrams * 0.228 * 10) / 10,
      fat: Math.round(meatGrams * 0.019 * 10) / 10,
      carbs: 1.0,
    };

    const currentP = mainMeat.protein + riceItem.protein + vegItem.protein;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🐖 【リクエスト対応】ビタミンB1で疲労回復！豚ヒレ肉定食',
      'home',
      '豚肉リクエスト',
      `豚肉のご要望に応え、糖質代謝を促進するビタミンB1が豊富な豚ヒレ肉をチョイス。脂質を抑えつつ疲労回復にも効果抜群です！`,
      [mainMeat, riceItem, vegItem, ...subItems]
    );
  }

  // (E) 魚・刺身・海鮮
  if (req.includes('魚') || req.includes('刺身') || req.includes('鮭') || req.includes('タラ') || req.includes('海鮮') || req.includes('さかな') || req.includes('鯖') || req.includes('サバ') || req.includes('マグロ')) {
    const fishGrams = 140;
    const isMaguro = req.includes('刺身') || req.includes('マグロ') || isFatOver;
    const mainFish: RecommendedItem = isMaguro
      ? {
          name: 'マグロ赤身の刺身 (超低脂質・高タンパク)',
          weightGrams: fishGrams,
          calories: Math.round(fishGrams * 1.25),
          protein: Math.round(fishGrams * 0.264 * 10) / 10,
          fat: Math.round(fishGrams * 0.014 * 10) / 10,
          carbs: 0.1,
        }
      : {
          name: '鮭の塩焼き (良質オメガ3脂肪酸)',
          weightGrams: fishGrams,
          calories: Math.round(fishGrams * 1.33),
          protein: Math.round(fishGrams * 0.223 * 10) / 10,
          fat: Math.round(fishGrams * 0.045 * 10) / 10,
          carbs: 0.1,
        };

    const soupItem: RecommendedItem = {
      name: 'アサリまたはシジミの味噌汁',
      weightGrams: 160,
      calories: 35,
      protein: 2.8,
      fat: 0.8,
      carbs: 3.8,
    };

    const currentP = mainFish.protein + riceItem.protein + soupItem.protein;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🐟 【リクエスト対応】極上の海の恵み！お魚ヘルシー和定食',
      'home',
      'お魚和食',
      `お魚リクエストに合わせ、脂質を最小限に抑えつつアミノ酸スコア100の上質タンパク質を補給する定食です。`,
      [mainFish, riceItem, soupItem, ...subItems]
    );
  }

  // (F) カレー
  if (req.includes('カレー')) {
    const items: RecommendedItem[] = [
      {
        name: '低脂質チキンとトマトのスパイススパイスカレー (皮なし鶏肉たっぷり)',
        weightGrams: 200,
        calories: 220,
        protein: 28.0,
        fat: 4.5,
        carbs: 15.0,
      },
      riceItem,
      {
        name: 'ゆで卵 (カレートッピング 1個)',
        weightGrams: 50,
        calories: 65,
        protein: 6.3,
        fat: 4.3,
        carbs: 0.4,
      },
    ];

    const currentP = 28.0 + riceItem.protein + 6.3;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🍛 【リクエスト対応】スパイス香る！低脂質高タンパクチキンカレー',
      'home',
      'カレーリクエスト',
      `ルーの脂質をカットし、スパイスとトマトベースで仕上げたダイエッター向け特製チキンカレーです！`,
      [...items, ...subItems]
    );
  }

  // (G) 鍋・スープ
  if (req.includes('鍋') || req.includes('スープ') || req.includes('ポトフ')) {
    const items: RecommendedItem[] = [
      {
        name: '具だくさん鶏むね肉と豆腐の水炊き鍋 (白菜・きのこ・ネギたっぷり)',
        weightGrams: 350,
        calories: 240,
        protein: 34.0,
        fat: 5.0,
        carbs: 8.0,
      },
      riceItem,
      {
        name: '〆の雑炊用 溶き卵 1個',
        weightGrams: 50,
        calories: 65,
        protein: 6.3,
        fat: 4.3,
        carbs: 0.4,
      },
    ];

    const currentP = 34.0 + riceItem.protein + 6.3;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🍲 【リクエスト対応】体の芯から温まる！具だくさん高タンパク鶏鍋',
      'home',
      'お鍋リクエスト',
      `水分と食物繊維もたっぷりとれて満腹感抜群！脂質を最小限に抑えたヘルシー鍋プランです。`,
      [...items, ...subItems]
    );
  }

  // 2. 麺類・パスタ・うどん・そば
  if (req.includes('麺') || req.includes('パスタ') || req.includes('うどん') || req.includes('そば') || req.includes('ラーメン')) {
    const isSoba = req.includes('そば') || req.includes('蕎麦');
    const noodleName = isSoba ? '十割そば (ざる・ぶっかけ)' : req.includes('うどん') ? '讃岐うどん (温または冷)' : '全粒粉パスタ (和風きのこ)';
    const noodleGrams = Math.min(250, Math.max(150, Math.round(remainingC * 2.5 / 10) * 10 || 200));
    const noodleC = Math.round(noodleGrams * 0.28 * 10) / 10;
    const noodleP = Math.round(noodleGrams * 0.05 * 10) / 10;
    const noodleCal = Math.round(noodleGrams * 1.35);

    const neededP = Math.max(15, remainingP - noodleP);
    const meatGrams = Math.min(200, Math.round(neededP / 0.23 / 10) * 10 || 150);

    const items: RecommendedItem[] = [
      {
        name: noodleName,
        weightGrams: noodleGrams,
        calories: noodleCal,
        protein: noodleP,
        fat: 1.0,
        carbs: noodleC,
      },
      {
        name: isFatOver ? 'トッピング: 蒸し鶏ササミ (ほぐし)' : 'トッピング: 温泉卵と豚しゃぶ肉',
        weightGrams: meatGrams,
        calories: Math.round(meatGrams * 1.1),
        protein: Math.round(meatGrams * 0.23 * 10) / 10,
        fat: isFatOver ? 0.8 : 4.5,
        carbs: 0.2,
      },
      {
        name: '薬味 (刻みネギ・大根おろし・生姜・刻み海苔)',
        weightGrams: 50,
        calories: 18,
        protein: 0.8,
        fat: 0.1,
        carbs: 3.5,
      },
    ];

    const currentP = noodleP + Math.round(meatGrams * 0.23 * 10) / 10;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      `🍜 【リクエスト対応】高タンパク・ヘルシー${isSoba ? '蕎麦' : '麺'}セット`,
      'quick',
      '麺類リクエスト',
      `「${rawReq}」のご要望に合わせて、脂質を抑えつつタンパク質と糖質をきっちり補給できる特製麺メニューを構成しました！`,
      [...items, ...subItems]
    );
  }

  // 3. コンビニ指定
  if (req.includes('コンビニ') || req.includes('セブン') || req.includes('ローソン') || req.includes('ファミマ')) {
    const items: RecommendedItem[] = [
      {
        name: 'サラダチキン (ハーブまたはスモーク 1袋)',
        weightGrams: 110,
        calories: 115,
        protein: 24.1,
        fat: 1.2,
        carbs: 0.5,
      },
      {
        name: 'おにぎり (鮭または梅 1個目)',
        weightGrams: 110,
        calories: 175,
        protein: 4.2,
        fat: 1.1,
        carbs: 37.0,
      },
      {
        name: '味付き半熟ゆで卵 (1個)',
        weightGrams: 50,
        calories: 65,
        protein: 6.3,
        fat: 4.3,
        carbs: 0.4,
      },
    ];

    if (remainingC >= 55) {
      items.push({
        name: 'おにぎり (昆布または赤飯 2個目)',
        weightGrams: 110,
        calories: 170,
        protein: 3.5,
        fat: 0.8,
        carbs: 37.5,
      });
    }

    if (remainingP >= 40) {
      items.push({
        name: 'たんぱく質が摂れる 豆腐バー (1本)',
        weightGrams: 68,
        calories: 104,
        protein: 10.0,
        fat: 6.3,
        carbs: 1.8,
      });
    }

    if (remainingP >= 60) {
      items.push({
        name: 'SAVAS プロテインドリンク (ミルクプロテイン20g 1本)',
        weightGrams: 200,
        calories: 102,
        protein: 20.0,
        fat: 0.0,
        carbs: 5.5,
      });
    }

    return createPlan(
      'plan_custom_' + Date.now(),
      '🏪 【リクエスト対応】コンビニ厳選！即買いPFC最適化セット',
      'convenience',
      'コンビニ',
      `コンビニですぐ買えて調理ゼロ！朝昼の残り枠（P+${remainingP}g）をしっかりカバーする黄金コンビです。`,
      items
    );
  }

  // 4. お酒・おつまみ・居酒屋
  if (req.includes('酒') || req.includes('つまみ') || req.includes('ビール') || req.includes('ハイボール') || req.includes('居酒屋')) {
    const items: RecommendedItem[] = [
      {
        name: '塩茹で枝豆 (食物繊維＆植物性P)',
        weightGrams: 100,
        calories: 134,
        protein: 11.7,
        fat: 6.2,
        carbs: 8.8,
      },
      {
        name: '焼き鳥 ササミ串＆砂肝串 (塩 2本)',
        weightGrams: 100,
        calories: 110,
        protein: 23.5,
        fat: 1.8,
        carbs: 0.1,
      },
      {
        name: '冷奴 (生姜醤油・ネギ)',
        weightGrams: 150,
        calories: 84,
        protein: 7.4,
        fat: 4.5,
        carbs: 2.7,
      },
    ];

    if (remainingC >= 30) {
      items.push({
        name: '〆のおにぎり (梅または鮭 1個)',
        weightGrams: 100,
        calories: 160,
        protein: 3.8,
        fat: 1.0,
        carbs: 34.0,
      });
    }

    return createPlan(
      'plan_custom_' + Date.now(),
      '🍺 【リクエスト対応】罪悪感ゼロ！高タンパク居酒屋おつまみセット',
      'quick',
      'おつまみ風',
      `「お酒やおつまみ風にしたい」というご要望に応え、脂質を抑えつつタンパク質をたっぷり確保できるヘルシーおつまみ構成です！`,
      items
    );
  }

  // 5. さっぱり・和食・あっさり
  if (req.includes('さっぱり') || req.includes('あっさり') || req.includes('冷') || req.includes('和食')) {
    const items: RecommendedItem[] = [
      {
        name: '蒸し鶏むね肉の梅しそポン酢和え',
        weightGrams: 180,
        calories: 210,
        protein: 41.9,
        fat: 3.4,
        carbs: 2.8,
      },
      riceItem,
      {
        name: '冷やしトマト＆キュウリの浅漬け',
        weightGrams: 120,
        calories: 25,
        protein: 1.0,
        fat: 0.1,
        carbs: 4.8,
      },
      {
        name: 'わかめとお麩のお吸い物',
        weightGrams: 150,
        calories: 18,
        protein: 1.2,
        fat: 0.2,
        carbs: 2.8,
      },
    ];

    const currentP = 41.9 + riceItem.protein + 1.0 + 1.2;
    const subItems = balanceSubItems(currentP);

    return createPlan(
      'plan_custom_' + Date.now(),
      '🥗 【リクエスト対応】胃もたれゼロ！さっぱり梅しそ蒸し鶏定食',
      'home',
      'さっぱり和食',
      `「さっぱりしたものが食べたい」にぴったり！酸味と香味野菜で食欲をそそり、脂質ほぼゼロで消化に優しい構成です。`,
      [...items, ...subItems]
    );
  }

  // 6. デフォルト（鶏むね肉定食、または未指定リクエスト）
  // 1食の肉上限は200g
  const meatGrams = Math.min(200, Math.max(120, Math.round((remainingP / 0.233) / 10) * 10 || 180));
  const mainMeat: RecommendedItem = {
    name: isFatOver ? `鶏むね肉 (皮なしソテー・塩コショウ)` : `鶏むね肉または豚ヒレ肉のソテー`,
    weightGrams: meatGrams,
    calories: Math.round(meatGrams * 1.16),
    protein: Math.round(meatGrams * 0.233 * 10) / 10,
    fat: isFatOver ? Math.round(meatGrams * 0.019 * 10) / 10 : 4.0,
    carbs: 0,
  };

  const currentP = mainMeat.protein + riceItem.protein + vegItem.protein;
  const subItems = balanceSubItems(currentP);

  return createPlan(
    'plan_custom_' + Date.now(),
    `✨ 【リクエスト対応】${rawReq ? `「${rawReq}」` : '今夜の最適'}カスタムPFCディナー`,
    'home',
    'オーダーメイド',
    `ご要望「${rawReq || 'PFC最適化'}」に合わせて、今夜の残り枠（P+${remainingP}g / F:${remainingF <= 0 ? 'カット' : `+${remainingF}g`} / C+${remainingC}g）をバランスよく達成できるよう専用計算しました！`,
    [mainMeat, riceItem, vegItem, ...subItems]
  );
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

    // 最新推奨モデル gemini-3.8-flash / フォールバック gemini-flash-latest
    let res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`,
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
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error && errJson.error.message) {
          errMsg = errJson.error.message;
        }
      } catch {}
      throw new Error(`Gemini APIエラー: ${errMsg}`);
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini APIから回答テキストが得られませんでした。');
    }

    // マークダウンコードブロックのクリーンアップ
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('AIの回答をJSONとして解析できませんでした。もう一度お試しください。');
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('AIの回答にメニュー品目が含まれていませんでした。');
    }

    return createPlan(
      'plan_ai_' + Date.now(),
      '✨ ' + (parsed.title || 'AIカスタム夕食プラン'),
      'ai',
      'AIシェフ特製',
      parsed.description || '朝昼の食事内容とリクエストに合わせてAIが専用設計した夕食プランです。',
      parsed.items
    );
  } catch (e: any) {
    console.error('Failed to generate AI dinner recommendation', e);
    throw e;
  }
}
