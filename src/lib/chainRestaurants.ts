import { ChainMenuItem } from '../types';

export const CHAIN_RESTAURANTS_LIST = [
  'すべて',
  '吉野家',
  'すき家',
  '松屋',
  'マクドナルド',
  'ケンタッキー',
  'サイゼリヤ',
  'やよい軒',
  '大戸屋',
  'コンビニ'
] as const;

export const POPULAR_CHAIN_MENU: ChainMenuItem[] = [
  // 吉野家
  {
    id: 'yoshinoya_gyudon_nami',
    restaurant: '吉野家',
    name: '牛丼 (並盛)',
    category: '丼もの',
    calories: 635,
    protein: 20.0,
    fat: 20.4,
    carbs: 88.9,
    note: '公式公表値'
  },
  {
    id: 'yoshinoya_gyudon_oomori',
    restaurant: '吉野家',
    name: '牛丼 (大盛)',
    category: '丼もの',
    calories: 822,
    protein: 25.8,
    fat: 26.4,
    carbs: 115.1,
    note: '公式公表値'
  },
  {
    id: 'yoshinoya_negitama',
    restaurant: '吉野家',
    name: 'ねぎ玉牛丼 (並盛)',
    category: '丼もの',
    calories: 737,
    protein: 23.7,
    fat: 27.7,
    carbs: 93.9,
    note: '公式公表値'
  },
  {
    id: 'yoshinoya_butadon',
    restaurant: '吉野家',
    name: '豚丼 (並盛)',
    category: '丼もの',
    calories: 586,
    protein: 18.5,
    fat: 16.8,
    carbs: 85.4,
    note: '公式公表値'
  },

  // すき家
  {
    id: 'sukiya_gyudon_nami',
    restaurant: 'すき家',
    name: '牛丼 (並盛)',
    category: '丼もの',
    calories: 733,
    protein: 22.9,
    fat: 25.0,
    carbs: 104.1,
    note: '公式公表値'
  },
  {
    id: 'sukiya_gyudon_chumori',
    restaurant: 'すき家',
    name: '牛丼 (中盛)',
    category: '丼もの',
    calories: 798,
    protein: 29.8,
    fat: 32.4,
    carbs: 96.9,
    note: '公式公表値 (肉1.5倍/ご飯少なめ)'
  },
  {
    id: 'sukiya_cheese_gyudon',
    restaurant: 'すき家',
    name: 'とろ〜り3種のチーズ牛丼 (並盛)',
    category: '丼もの',
    calories: 911,
    protein: 33.2,
    fat: 38.4,
    carbs: 108.1,
    note: '公式公表値'
  },

  // 松屋
  {
    id: 'matsuya_gyumeshi_nami',
    restaurant: '松屋',
    name: '牛めし (並盛)',
    category: '丼もの',
    calories: 709,
    protein: 20.9,
    fat: 27.9,
    carbs: 88.5,
    note: '公式公表値 (みそ汁含む)'
  },
  {
    id: 'matsuya_curry',
    restaurant: '松屋',
    name: '松屋 創業ビーフカレー',
    category: 'カレー',
    calories: 638,
    protein: 12.6,
    fat: 20.5,
    carbs: 96.1,
    note: '公式公表値'
  },

  // マクドナルド
  {
    id: 'mcd_bigmac',
    restaurant: 'マクドナルド',
    name: 'ビッグマック',
    category: 'バーガー',
    calories: 525,
    protein: 25.9,
    fat: 28.2,
    carbs: 41.8,
    note: '公式公表値'
  },
  {
    id: 'mcd_cheeseburger',
    restaurant: 'マクドナルド',
    name: 'チーズバーガー',
    category: 'バーガー',
    calories: 307,
    protein: 15.8,
    fat: 13.4,
    carbs: 30.8,
    note: '公式公表値'
  },
  {
    id: 'mcd_teriyaki',
    restaurant: 'マクドナルド',
    name: 'てりやきマックバーガー',
    category: 'バーガー',
    calories: 478,
    protein: 14.3,
    fat: 30.3,
    carbs: 36.9,
    note: '公式公表値'
  },
  {
    id: 'mcd_nugget_5',
    restaurant: 'マクドナルド',
    name: 'チキンマックナゲット (5ピース)',
    category: 'サイド',
    calories: 263,
    protein: 15.5,
    fat: 16.9,
    carbs: 12.2,
    note: '公式公表値 (ソース除く)'
  },
  {
    id: 'mcd_potato_m',
    restaurant: 'マクドナルド',
    name: 'マックフライポテト (M)',
    category: 'サイド',
    calories: 410,
    protein: 5.3,
    fat: 20.6,
    carbs: 51.0,
    note: '公式公表値'
  },

  // ケンタッキー
  {
    id: 'kfc_original_chicken',
    restaurant: 'ケンタッキー',
    name: 'オリジナルチキン (1ピース)',
    category: 'チキン',
    calories: 218,
    protein: 18.3,
    fat: 13.6,
    carbs: 7.9,
    note: '公式公表値'
  },
  {
    id: 'kfc_boneless',
    restaurant: 'ケンタッキー',
    name: '骨なしケンタッキー (1ピース)',
    category: 'チキン',
    calories: 191,
    protein: 21.0,
    fat: 8.9,
    carbs: 10.0,
    note: '公式公表値'
  },

  // サイゼリヤ
  {
    id: 'saizeriya_doria',
    restaurant: 'サイゼリヤ',
    name: 'ミラノ風ドリア',
    category: 'ドリア・グラタン',
    calories: 521,
    protein: 15.6,
    fat: 19.4,
    carbs: 65.3,
    note: '公式公表値'
  },
  {
    id: 'saizeriya_shrimp_salad',
    restaurant: 'サイゼリヤ',
    name: '小エビのサラダ',
    category: 'サラダ',
    calories: 126,
    protein: 6.2,
    fat: 9.1,
    carbs: 5.0,
    note: '公式公表値'
  },
  {
    id: 'saizeriya_karami_chicken',
    restaurant: 'サイゼリヤ',
    name: '辛味チキン (4本)',
    category: '前菜・チキン',
    calories: 374,
    protein: 17.4,
    fat: 26.5,
    carbs: 16.6,
    note: '公式公表値'
  },
  {
    id: 'saizeriya_diavola_chicken',
    restaurant: 'サイゼリヤ',
    name: '若鶏のディアボラ風',
    category: 'メイン・肉',
    calories: 543,
    protein: 38.2,
    fat: 38.9,
    carbs: 8.4,
    note: '公式公表値 (高タンパク)'
  },
  {
    id: 'saizeriya_green_peas',
    restaurant: 'サイゼリヤ',
    name: '青豆の温サラダ',
    category: '温菜',
    calories: 199,
    protein: 8.9,
    fat: 12.5,
    carbs: 12.4,
    note: '公式公表値'
  },

  // やよい軒
  {
    id: 'yayoiken_shogayaki',
    restaurant: 'やよい軒',
    name: 'しょうが焼定食',
    category: '定食',
    calories: 766,
    protein: 32.5,
    fat: 30.5,
    carbs: 91.2,
    note: '公式公表値 (普通盛ご飯・みそ汁含む)'
  },
  {
    id: 'yayoiken_karaage',
    restaurant: 'やよい軒',
    name: 'から揚げ定食',
    category: '定食',
    calories: 982,
    protein: 42.2,
    fat: 48.3,
    carbs: 94.0,
    note: '公式公表値'
  },
  {
    id: 'yayoiken_saba_shioyaki',
    restaurant: 'やよい軒',
    name: 'サバの塩焼定食',
    category: '定食',
    calories: 693,
    protein: 33.4,
    fat: 27.7,
    carbs: 78.8,
    note: '公式公表値 (良質な脂質・高タンパク)'
  },

  // 大戸屋
  {
    id: 'ootoya_kurozu_chicken',
    restaurant: '大戸屋',
    name: '鶏と野菜の黒酢あん定食',
    category: '定食',
    calories: 856,
    protein: 29.8,
    fat: 30.1,
    carbs: 113.8,
    note: '公式公表値 (普通盛白米・みそ汁含む)'
  },
  {
    id: 'ootoya_saba_sumibiyaki',
    restaurant: '大戸屋',
    name: 'さばの炭火焼き定食',
    category: '定食',
    calories: 815,
    protein: 37.4,
    fat: 44.2,
    carbs: 68.4,
    note: '公式公表値'
  },

  // コンビニ
  {
    id: 'cvs_seven_salad_chicken',
    restaurant: 'コンビニ',
    name: 'セブン 糖質0gサラダチキン (プレーン)',
    category: 'コンビニ',
    calories: 114,
    protein: 24.1,
    fat: 1.2,
    carbs: 0.1,
    note: '公式公表値 (1個110gあたり)'
  },
  {
    id: 'cvs_seven_onigiri_tunamayo',
    restaurant: 'コンビニ',
    name: 'セブン 手巻おにぎり ツナマヨネーズ',
    category: 'コンビニ',
    calories: 246,
    protein: 4.8,
    fat: 9.2,
    carbs: 36.1,
    note: '公式公表値'
  },
  {
    id: 'cvs_seven_chicken_egg',
    restaurant: 'コンビニ',
    name: 'セブン たんぱく質が摂れるチキン＆エッグ',
    category: 'コンビニ',
    calories: 340,
    protein: 26.0,
    fat: 12.0,
    carbs: 28.0,
    note: '公式公表値'
  },
  {
    id: 'cvs_lawson_karaagekun',
    restaurant: 'コンビニ',
    name: 'ローソン からあげクン (レギュラー)',
    category: 'コンビニ',
    calories: 220,
    protein: 14.0,
    fat: 14.0,
    carbs: 8.0,
    note: '公式公表値 (1パックあたり)'
  },
  {
    id: 'cvs_lawson_bran_bread',
    restaurant: 'コンビニ',
    name: 'ローソン ブランパン (2個入)',
    category: 'コンビニ',
    calories: 132,
    protein: 11.4,
    fat: 5.4,
    carbs: 4.4,
    note: '公式公表値 (2個あたり)'
  },
  {
    id: 'cvs_famima_famichiki',
    restaurant: 'コンビニ',
    name: 'ファミマ ファミチキ (骨なし)',
    category: 'コンビニ',
    calories: 252,
    protein: 12.7,
    fat: 15.7,
    carbs: 14.8,
    note: '公式公表値'
  }
];
