import { CoachType } from '../../types';

export type CoachMood = 'normal' | 'happy' | 'cheer' | 'warning' | 'hungry';

export interface CoachProfile {
  id: CoachType;
  name: string;
  role: string;
  avatarIcon: string; // 絵文字
  badgeColor: string;
  bubbleBg: string;
  bubbleBorder: string;
  textColor: string;
  bgGradient: string;
  description: string;
  greetings: string[];
}

export const COACH_PROFILES: Record<CoachType, CoachProfile> = {
  piyo: {
    id: 'piyo',
    name: 'ぴよコック',
    role: '見習い栄養士ひよこ',
    avatarIcon: '🐥',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    bubbleBg: 'bg-amber-50/90',
    bubbleBorder: 'border-amber-200',
    textColor: 'text-amber-950',
    bgGradient: 'from-amber-400 to-yellow-500',
    description: 'ほんわか癒やし系。いつでも一生懸命あなたを応援してくれるピヨ！',
    greetings: [
      '今日も元気にがんばるピヨ！',
      'おいしく食べて健康になろうピヨ！',
      'なんでも相談してほしいピヨ〜！'
    ]
  },
  muscle: {
    id: 'muscle',
    name: '鬼コーチ・マッスル',
    role: '熱血PFCトレーナー',
    avatarIcon: '💪',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    bubbleBg: 'bg-orange-50/90',
    bubbleBorder: 'border-orange-200',
    textColor: 'text-orange-950',
    bgGradient: 'from-orange-500 to-red-600',
    description: '熱血ストイック系。筋肉と理想の体づくりを全力で鼓舞するぞ！',
    greetings: [
      '今日も限界を超えていけ！マッスル！',
      'PFCの乱れは心の乱れだ！気合を入れろ！',
      'タンパク質は裏切らない！いくぞ！'
    ]
  },
  elena: {
    id: 'elena',
    name: '管理栄養士エレナ',
    role: 'スマート理論派栄養士',
    avatarIcon: '👩‍⚕️',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bubbleBg: 'bg-emerald-50/90',
    bubbleBorder: 'border-emerald-200',
    textColor: 'text-emerald-950',
    bgGradient: 'from-emerald-500 to-teal-600',
    description: '理論派スマート系。的確でエビデンスに基づいたアドバイスを提供します。',
    greetings: [
      'こんにちは。今日もスマートにPFCをマネジメントしましょう。',
      '数字は嘘をつきません。計画的な食事が一番の近道です。',
      'どのような食事状況でも、最適なリカバリープランを導きます。'
    ]
  }
};
