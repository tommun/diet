import { CoachType, FoodItem, TargetPFC } from '../types';
import { CoachMood } from '../components/CharacterCoach/characterData';

export interface CoachAdviceResult {
  coachType: CoachType;
  mood: CoachMood;
  title: string;
  message: string;
  recommendedFoods: string[];
  statusBadge: {
    text: string;
    color: string;
  };
}

export function evaluatePFCStatus(
  target: TargetPFC,
  currentItems: FoodItem[],
  coachType: CoachType = 'piyo'
): CoachAdviceResult {
  const totals = currentItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      fat: acc.fat + (item.fat || 0),
      carbs: acc.carbs + (item.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const cal = Math.round(totals.calories);
  const p = Math.round(totals.protein * 10) / 10;
  const f = Math.round(totals.fat * 10) / 10;
  const c = Math.round(totals.carbs * 10) / 10;

  const targetCal = target.calories || 2000;
  const targetP = target.protein || 130;
  const targetF = target.fat || 50;
  const targetC = target.carbs || 250;

  const remainingP = Math.round((targetP - p) * 10) / 10;
  const remainingF = Math.round((targetF - f) * 10) / 10;
  const remainingC = Math.round((targetC - c) * 10) / 10;

  const pRatio = targetP > 0 ? p / targetP : 0;
  const fRatio = targetF > 0 ? f / targetF : 0;
  const calRatio = targetCal > 0 ? cal / targetCal : 0;

  const nowHour = new Date().getHours();
  const isLunchTime = nowHour >= 11 && nowHour < 15;
  const isEvening = nowHour >= 17;

  // 1. まだ何も記録されていない時
  if (currentItems.length === 0) {
    if (coachType === 'piyo') {
      return {
        coachType,
        mood: 'normal',
        title: 'おはようピヨ！',
        message: '今日の最初のごはんを教えてほしいピヨ！朝ごはんをしっかり食べると1日の代謝スイッチが入るピヨ✨',
        recommendedFoods: ['目玉焼き', 'ごはん', '納豆', 'お味噌汁', 'プロテイン'],
        statusBadge: { text: '記録待ち', color: 'bg-slate-100 text-slate-700' }
      };
    }
    if (coachType === 'muscle') {
      return {
        coachType,
        mood: 'cheer',
        title: '今日も気合十分か！？',
        message: '本日の戦いが始まったぞ！まずは朝食でタンパク質を補給して、筋肉のアナボリック状態をつくるんだ！',
        recommendedFoods: ['卵2〜3個', 'オートミールまたは白米', 'プロテイン', 'バナナ'],
        statusBadge: { text: '出撃前', color: 'bg-red-100 text-red-700' }
      };
    }
    return {
      coachType,
      mood: 'normal',
      title: '本日の管理を開始します',
      message: '朝食の記録から始めましょう。朝のタンパク質補給は体内時計のリセットと基礎代謝の向上に直結します。',
      recommendedFoods: ['全粒粉パン', '卵料理', 'ギリシャヨーグルト', 'フルーツ'],
      statusBadge: { text: '記録待機', color: 'bg-emerald-100 text-emerald-700' }
    };
  }

  // 2. 脂質が目標を超過している時（Fオーバー）
  if (fRatio >= 1.05) {
    const overF = Math.round((f - targetF) * 10) / 10;
    if (coachType === 'piyo') {
      return {
        coachType,
        mood: 'warning',
        title: 'あわわ！脂質が枠を超えちゃったピヨ！',
        message: `脂質が目標より +${overF}g 多いピヨ💦 次のごはんは揚げ物や炒め油をお休みして、皮なし鶏むね肉や蒸し料理、刺身がおすすめピヨ！`,
        recommendedFoods: ['皮なし鶏むね肉', '鶏ササミ', 'マグロ赤身', '冷奴', 'お吸い物'],
        statusBadge: { text: '脂質注意報！', color: 'bg-amber-100 text-amber-800' }
      };
    }
    if (coachType === 'muscle') {
      return {
        coachType,
        mood: 'warning',
        title: '待て！脂質リミッター解除されているぞ！',
        message: `脂質が +${overF}g オーバーだ！だが慌てるな！次の飯は極限まで油を切れ！皮なし鶏むね肉のソテー（塩コショウ）か刺身でタンパク質だけを回収するんだ！`,
        recommendedFoods: ['皮なし鶏むね肉 (蒸し/ソテー)', 'ノンオイルツナ缶', 'ホエイプロテイン (水割り)', 'ブロッコリー'],
        statusBadge: { text: 'ノンオイル発令！', color: 'bg-red-100 text-red-800' }
      };
    }
    return {
      coachType,
      mood: 'warning',
      title: '脂質摂取量が上限に達しています',
      message: `脂質が目標値より +${overF}g 超過しています。炭水化物とタンパク質にはまだ枠がありますので、夕食は調理油を使わない和定食スタイルが最も合理的です。`,
      recommendedFoods: ['タラのホイル焼き (ポン酢)', 'マグロ赤身の刺身', '蒸し鶏の梅しそ和え', '白米 (適量)'],
      statusBadge: { text: '低脂質リカバリー推奨', color: 'bg-rose-100 text-rose-800' }
    };
  }

  // 3. タンパク質がかなり不足している時（P不足）
  if (remainingP >= 70 && (isLunchTime || isEvening)) {
    if (coachType === 'piyo') {
      return {
        coachType,
        mood: 'hungry',
        title: 'タンパク質がもっとほしいピヨ〜！',
        message: `あと約 ${remainingP}g のタンパク質が必要ピヨ！お肉、魚、卵、プロテインをしっかり食べて筋肉を守るピヨ！`,
        recommendedFoods: ['鶏むね肉', 'サラダチキン', '温泉卵', '納豆', 'プロテイン'],
        statusBadge: { text: 'Pチャージ急務！', color: 'bg-blue-100 text-blue-800' }
      };
    }
    if (coachType === 'muscle') {
      return {
        coachType,
        mood: 'hungry',
        title: '筋肉がタンパク質を求めて泣いているぞ！',
        message: `残りタンパク質が ${remainingP}g だ！このまま夜を迎えたら筋肉が分解してしまうぞ！肉を食え、プロテインを飲め！`,
        recommendedFoods: ['鶏もも肉 (皮なし200g)', '牛赤身ステーキ', 'ホエイプロテイン (2杯)', 'ゆで卵2個'],
        statusBadge: { text: 'プロテイン緊急招集！', color: 'bg-orange-100 text-orange-800' }
      };
    }
    return {
      coachType,
      mood: 'hungry',
      title: 'タンパク質が目標を下回っています',
      message: `目標達成にはあと約 ${remainingP}g のタンパク質が必要です。一食で大量に摂るより、食事と就寝前のプロテイン補給に分散させるのが吸収率的にも推奨されます。`,
      recommendedFoods: ['鮭の塩焼き', '鶏ささみ', 'ギリシャヨーグルト', '豆腐ハンバーグ'],
      statusBadge: { text: 'タンパク質補給推奨', color: 'bg-indigo-100 text-indigo-800' }
    };
  }

  // 4. カロリーほぼ満了＆バランス良好（パーフェクト！）
  if (calRatio >= 0.85 && calRatio <= 1.05 && pRatio >= 0.85 && fRatio <= 1.05) {
    if (coachType === 'piyo') {
      return {
        coachType,
        mood: 'happy',
        title: 'すごすぎるピヨ！神バランスピヨ！✨',
        message: 'カロリーもタンパク質も脂質も、まさに理想の黄金バランスピヨ！最高の1日になったピヨ、本当にお疲れ様ピヨ〜！🎉',
        recommendedFoods: ['白湯', 'ノンカフェインハーブティー', 'ストレッチ'],
        statusBadge: { text: 'パーフェクト達成！', color: 'bg-emerald-100 text-emerald-800' }
      };
    }
    if (coachType === 'muscle') {
      return {
        coachType,
        mood: 'happy',
        title: '見事だ！これが本物の規律だ！！🔥',
        message: '完璧なPFCコントロールを成し遂げたな！筋肉も体脂肪もこれ以上ない理想の軌道に乗っているぞ！胸を張れ、マッスル！！',
        recommendedFoods: ['EAAまたはBCAA (水分補給)', '十分な睡眠 (7時間以上)'],
        statusBadge: { text: 'マッスル大勝利！', color: 'bg-red-100 text-red-800' }
      };
    }
    return {
      coachType,
      mood: 'happy',
      title: '極めて高水準な栄養バランスです',
      message: '本日のPFCバランスは完璧にコントロールされています。この食事習慣を継続することが、最も確実な目標体重への最短ルートです。',
      recommendedFoods: ['十分な水分補給', '良質な休息'],
      statusBadge: { text: '理想的達成', color: 'bg-teal-100 text-teal-800' }
    };
  }

  // 5. 順調に進んでいる時（通常・応援）
  if (coachType === 'piyo') {
    return {
      coachType,
      mood: 'cheer',
      title: 'いい調子で進んでるピヨ！',
      message: `現在 ${cal}kcal 摂取ピヨ！残り枠（P:+${remainingP}g / F:+${Math.max(0, remainingF)}g / C:+${remainingC}g）に合わせて、おいしく調整していこうピヨ！`,
      recommendedFoods: ['和食定食', '温野菜', '具だくさんお味噌汁', 'おにぎり'],
      statusBadge: { text: '順調ピヨ！', color: 'bg-green-100 text-green-800' }
    };
  }

  if (coachType === 'muscle') {
    return {
      coachType,
      mood: 'cheer',
      title: '順調だな！だが油断は禁物だ！',
      message: `現在 ${cal}kcal だ！残り枠（P:+${remainingP}g / F:+${Math.max(0, remainingF)}g / C:+${remainingC}g）をジャストで射程圏内に収めて、今日の勝利を確定させろ！`,
      recommendedFoods: ['鶏肉ソテー', '白米ごはん', '納豆', 'キムチ'],
      statusBadge: { text: '前進中！', color: 'bg-amber-100 text-amber-800' }
    };
  }

  return {
    coachType,
    mood: 'cheer',
    title: 'ペース配分は順調です',
    message: `現在の総摂取は ${cal}kcal です。残り枠（P:+${remainingP}g / F:+${Math.max(0, remainingF)}g / C:+${remainingC}g）を意識し、次の食事をセレクトしてください。`,
    recommendedFoods: ['魚料理', 'きのこ類', '海藻サラダ', '玄米・麦飯'],
    statusBadge: { text: '安定推移', color: 'bg-sky-100 text-sky-800' }
  };
}

/**
 * Gemini APIを活用したキャラクター視点での深いPFC栄養診断
 */
export async function getAiCoachDeepAdvice(
  apiKey: string,
  target: TargetPFC,
  currentItems: FoodItem[],
  coachType: CoachType = 'piyo',
  userQuestion?: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('APIキーが設定されていません。');
  }

  const totals = currentItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      fat: acc.fat + (item.fat || 0),
      carbs: acc.carbs + (item.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const cal = Math.round(totals.calories);
  const p = Math.round(totals.protein * 10) / 10;
  const f = Math.round(totals.fat * 10) / 10;
  const c = Math.round(totals.carbs * 10) / 10;

  const foodNames = currentItems.map(i => `${i.name}(${i.calories}kcal, P:${i.protein}g F:${i.fat}g C:${i.carbs}g)`).join(', ');

  const systemPersona = coachType === 'piyo'
    ? 'あなたは「ぴよコック」という名前の、ひよこの見習い栄養士マスコットです。愛らしくほんわかした口調で、語尾は必ず「〜ピヨ！」「〜ピヨ〜」になります。ユーザーに優しく寄り添いながら、栄養学的に的確なアドバイスと応援をします。'
    : coachType === 'muscle'
    ? 'あなたは「鬼コーチ・マッスル」という名前の熱血フィジカルトレーナーです。語尾は「〜だ！」「〜ぞ！」「〜マッスル！」など熱く力強い言葉遣いです。筋肉を愛し、タンパク質の大切さと脂質管理の重要性を熱烈に説きます。'
    : 'あなたは「管理栄養士エレナ」という名前の、クールで知的なプロの管理栄養士です。丁寧で論理的（です・ます調）で、エビデンスに基づいたスマートな分析と具体的なリカバリー策をわかりやすく提案します。';

  const prompt = `
${systemPersona}

【ユーザーの本日の目標PFC】
- カロリー: ${target.calories} kcal
- タンパク質 (P): ${target.protein} g
- 脂質 (F): ${target.fat} g
- 炭水化物 (C): ${target.carbs} g

【本日の食事実績】
${foodNames || 'まだ記録なし'}

【現在の合計と残り】
- 摂取カロリー: ${cal} kcal (残り: ${target.calories - cal} kcal)
- 摂取P: ${p} g (残り: ${Math.round((target.protein - p) * 10) / 10} g)
- 摂取F: ${f} g (残り: ${Math.round((target.fat - f) * 10) / 10} g)
- 摂取C: ${c} g (残り: ${Math.round((target.carbs - c) * 10) / 10} g)

【ユーザーからの相談・質問】
${userQuestion && userQuestion.trim() ? userQuestion.trim() : '今日のPFCバランスの総合評価と、次の食事や夜の過ごし方へのアドバイスをください！'}

【依頼】
あなたのキャラクターの口調・性格を100%徹底して、以下の3点を親しみやすく回答してください（全体で200〜300文字程度）：
1. 今日の食事内容とPFCバランスの率直な講評（良かった点や注意点）
2. 今後の食事（または次の食事・間食・プロテイン）で具体的に選ぶべきおすすめ食材
3. ユーザーへのモチベーションが高まる温かい励ましの言葉
`;

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-3.8-flash',
  ];

  let reply = '';
  let lastStatus = 0;

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        reply = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (reply) break;
      } else {
        lastStatus = res.status;
      }
    } catch {
      // try next model
    }
  }

  if (!reply) {
    throw new Error(`AI通信エラー (HTTP ${lastStatus || 'error'})`);
  }

  return reply.trim();
}
