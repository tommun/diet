import React, { useState, useMemo } from 'react';
import { POPULAR_DISH_RECIPES, recalculateIngredient, sumRecipeIngredients } from '../../lib/recipeData';
import { POPULAR_CHAIN_MENU, CHAIN_RESTAURANTS_LIST } from '../../lib/chainRestaurants';
import { RecipeDish, Ingredient, FoodItem, ChainMenuItem } from '../../types';
import { decomposeDishRecipe, searchChainMenuItem } from '../../lib/geminiOcr';
import { Search, Sparkles, Check, Layers, RefreshCw, AlertCircle, Sliders, Store, Utensils, ArrowRight } from 'lucide-react';

interface DishSearchProps {
  apiKey?: string;
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onOpenSettings: () => void;
}

export const DishSearch: React.FC<DishSearchProps> = ({
  apiKey,
  onAddFoodItem,
  onOpenSettings,
}) => {
  // モード切り替え: 'chain' (コンビニ・チェーン店・公式値) or 'home' (家庭料理・材料内訳)
  const [subMode, setSubMode] = useState<'chain' | 'home'>('chain');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('すべて');

  // 家庭料理用のステート
  const [selectedDish, setSelectedDish] = useState<RecipeDish | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // チェーン店・コンビニ用の選択ステート
  const [selectedChainItem, setSelectedChainItem] = useState<ChainMenuItem | null>(null);

  // ローディング & エラー
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チェーン店メニューの絞り込み
  const filteredChainMenus = useMemo(() => {
    let list = POPULAR_CHAIN_MENU;
    if (selectedChainFilter === 'コンビニ') {
      list = list.filter((item) =>
        item.restaurant === 'コンビニ' ||
        item.restaurant === 'セブン-イレブン' ||
        item.restaurant === 'ローソン' ||
        item.restaurant === 'ファミリーマート'
      );
    } else if (selectedChainFilter !== 'すべて') {
      list = list.filter((item) => item.restaurant === selectedChainFilter);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.restaurant.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [selectedChainFilter, searchQuery]);

  // 家庭料理の絞り込み
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_DISH_RECIPES;
    const q = searchQuery.toLowerCase();
    return POPULAR_DISH_RECIPES.filter(
      (d) => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // -------------------------
  // 検索フォーム送信 (Enterキー または 検索ボタン)
  // -------------------------
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setError(null);

    if (subMode === 'chain') {
      // 1. まず内蔵データベースに合致するものがあるか確認
      const matched = POPULAR_CHAIN_MENU.find(
        (item) =>
          item.name.toLowerCase() === query.toLowerCase() ||
          item.name.toLowerCase().includes(query.toLowerCase())
      );

      if (matched && !apiKey) {
        setSelectedChainItem(matched);
        return;
      }

      // 2. APIキーがあれば公式PFCをAI検索
      if (apiKey) {
        await executeAiSearchChain(query);
      } else if (matched) {
        setSelectedChainItem(matched);
      } else {
        setError(`「${query}」の内蔵データが見つかりませんでした。設定からGemini APIキーを登録すると全国のコンビニ・外食メニューを即座に自動検索できます。`);
      }
    } else {
      // 家庭料理モード
      const matchedDish = POPULAR_DISH_RECIPES.find(
        (dish) => dish.name.toLowerCase().includes(query.toLowerCase())
      );
      if (matchedDish && !apiKey) {
        handleSelectDish(matchedDish);
        return;
      }

      if (apiKey) {
        await executeAiDecompose(query);
      } else if (matchedDish) {
        handleSelectDish(matchedDish);
      } else {
        setError(`「${query}」のレシピが見つかりませんでした。APIキーを登録するとAIが自動で材料と分量を分解します。`);
      }
    }
  };

  const executeAiSearchChain = async (query: string) => {
    if (!apiKey) {
      setError('公式PFC検索を利用するにはGemini APIキーが必要です。設定画面から登録してください。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const item = await searchChainMenuItem(query, apiKey);
      setSelectedChainItem(item);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'メニューのPFC検索に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const executeAiDecompose = async (query: string) => {
    if (!apiKey) {
      setError('AIレシピ分解を利用するにはGemini APIキーが必要です。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dish = await decomposeDishRecipe(query, apiKey);
      handleSelectDish(dish);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AIによるレシピ分解に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // チェーン店用のアクション
  // -------------------------
  const handleSelectChainItem = (item: ChainMenuItem) => {
    setSelectedChainItem(item);
    setError(null);
  };

  const handleAddChainItem = () => {
    if (!selectedChainItem) return;
    onAddFoodItem({
      name: `${selectedChainItem.restaurant} ${selectedChainItem.name}`,
      calories: selectedChainItem.calories,
      protein: selectedChainItem.protein,
      fat: selectedChainItem.fat,
      carbs: selectedChainItem.carbs,
      category: 'chain',
      restaurantName: selectedChainItem.restaurant,
    });
  };

  // -------------------------
  // 家庭料理用のアクション
  // -------------------------
  const handleSelectDish = (dish: RecipeDish) => {
    setSelectedDish(dish);
    setIngredients(dish.ingredients.map((ing) => ({ ...ing })));
    setError(null);
  };

  const handleGramsChange = (index: number, newGrams: number) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = recalculateIngredient(updated[index], Math.max(0, newGrams));
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const dishTotals = useMemo(() => {
    return sumRecipeIngredients(ingredients);
  }, [ingredients]);

  const handleAddDish = () => {
    if (!selectedDish) return;
    onAddFoodItem({
      name: selectedDish.name,
      calories: dishTotals.calories,
      protein: dishTotals.protein,
      fat: dishTotals.fat,
      carbs: dishTotals.carbs,
      weightGrams: dishTotals.weightGrams,
      category: 'dish',
      ingredients: ingredients,
    });
  };

  return (
    <div className="space-y-4">
      {/* モード切り替えタブ */}
      <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setSubMode('chain');
            setSelectedDish(null);
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            subMode === 'chain'
              ? 'bg-white text-orange-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store size={15} />
          <span>コンビニ・チェーン店 (公式公表PFC)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubMode('home');
            setSelectedChainItem(null);
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            subMode === 'home'
              ? 'bg-white text-orange-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils size={15} />
          <span>家庭料理・自炊 (材料と分量g内訳)</span>
        </button>
      </div>

      {/* 検索バー (Enterで即時PFC検索) */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            subMode === 'chain'
              ? '商品名を入力してEnter（例: からあげクン レッド、ツナマヨおにぎり、ファミチキ）'
              : '料理名を入力してEnter（例: カルボナーラ、親子丼、生姜焼き）'
          }
          className="w-full pl-10 pr-24 py-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white font-medium shadow-2xs"
        />

        <button
          type="submit"
          disabled={isLoading || !searchQuery.trim()}
          className="absolute right-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          title="PFCを検索"
        >
          {isLoading ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          <span>{isLoading ? '検索中...' : 'PFC検索'}</span>
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          {!apiKey && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="font-bold underline ml-2 shrink-0 text-orange-700 hover:text-orange-900"
            >
              APIキー設定
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. コンビニ・チェーン店モード                              */}
      {/* ======================================================== */}
      {subMode === 'chain' && (
        <div className="space-y-4">
          {/* 選択された商品がある場合：大きくPFCを表示 */}
          {selectedChainItem && (
            <div className="bg-orange-50/80 border-2 border-orange-300/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black bg-orange-600 text-white px-2 py-0.5 rounded-md">
                      {selectedChainItem.restaurant}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {selectedChainItem.category}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-slate-800 mt-1">
                    {selectedChainItem.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <span>✓ {selectedChainItem.note || '公式公表栄養成分表示'}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedChainItem(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 hover:underline font-semibold"
                >
                  閉じる
                </button>
              </div>

              {/* PFCサマリーカード */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white border border-orange-100 rounded-xl p-2.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">カロリー</span>
                  <span className="text-base sm:text-lg font-black text-slate-800">
                    {selectedChainItem.calories}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">kcal</span>
                  </span>
                </div>
                <div className="bg-white border border-orange-100 rounded-xl p-2.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-orange-600 block mb-0.5">たんぱく質 P</span>
                  <span className="text-base sm:text-lg font-black text-slate-800">
                    {selectedChainItem.protein}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">g</span>
                  </span>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-2.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-600 block mb-0.5">脂質 F</span>
                  <span className="text-base sm:text-lg font-black text-slate-800">
                    {selectedChainItem.fat}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">g</span>
                  </span>
                </div>
                <div className="bg-white border border-sky-100 rounded-xl p-2.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-sky-600 block mb-0.5">炭水化物 C</span>
                  <span className="text-base sm:text-lg font-black text-slate-800">
                    {selectedChainItem.carbs}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">g</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddChainItem}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check size={18} />
                <span>このメニューを記録に追加</span>
              </button>
            </div>
          )}

          {/* クイックチェーン・コンビニ切り替えタグ */}
          <div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CHAIN_RESTAURANTS_LIST.map((chain) => (
                <button
                  key={chain}
                  type="button"
                  onClick={() => setSelectedChainFilter(chain)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    selectedChainFilter === chain
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {chain === 'コンビニ' ? '🏪 コンビニ各社' : chain}
                </button>
              ))}
            </div>
          </div>

          {/* 候補・プリセット一覧 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                {searchQuery.trim()
                  ? `「${searchQuery}」の検索候補`
                  : selectedChainFilter === 'すべて'
                  ? '定番コンビニ・チェーンメニュー'
                  : `${selectedChainFilter}のメニュー`}
              </label>
              <span className="text-[11px] text-slate-400">
                {filteredChainMenus.length}件
              </span>
            </div>

            {filteredChainMenus.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-2">
                <p className="text-xs text-slate-600 font-bold">
                  「{searchQuery}」の内蔵データはありません
                </p>
                <p className="text-[11px] text-slate-400">
                  右上の「PFC検索」ボタンまたはEnterキーを押すと、公式栄養成分表示をAI検索して引っ張ってきます。
                </p>
                <button
                  type="button"
                  onClick={() => executeAiSearchChain(searchQuery.trim())}
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>「{searchQuery}」の公式PFCを今すぐ検索</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                {filteredChainMenus.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectChainItem(item)}
                    className="p-3 text-left border border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/20 rounded-xl transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-800 group-hover:text-orange-600">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full shrink-0 ml-1">
                        {item.restaurant}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-1">
                      <span className="text-slate-900 font-black">{item.calories} kcal</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-orange-600">P:{item.protein}g</span>
                      <span className="text-amber-600">F:{item.fat}g</span>
                      <span className="text-sky-600">C:{item.carbs}g</span>
                    </div>

                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-between">
                      <span>✓ {item.note || '公式公表値'}</span>
                      <span className="text-slate-400 group-hover:text-orange-600 flex items-center gap-0.5">
                        選択 <ArrowRight size={10} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. 家庭料理・材料内訳モード                              */}
      {/* ======================================================== */}
      {subMode === 'home' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
            <Layers size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">根拠がわかる家庭料理検索：</span>
              <p className="mt-0.5 text-emerald-800">
                「何が何グラム入っているか」を明記。「パスタ80gにした」「卵2個にした」など材料の分量をその場で変更して実態に合わせられます。
              </p>
            </div>
          </div>

          {!selectedDish ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                定番家庭料理から選択（材料・グラム数完全明記）
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                {filteredDishes.map((dish) => {
                  const previewTotals = sumRecipeIngredients(dish.ingredients);
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => handleSelectDish(dish)}
                      className="p-3 text-left border border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/20 rounded-xl transition-all shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800 group-hover:text-orange-600">
                          {dish.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {dish.category}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                        <span>{previewTotals.calories} kcal</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-orange-600">P:{previewTotals.protein}g</span>
                        <span className="text-amber-600">F:{previewTotals.fat}g</span>
                        <span className="text-sky-600">C:{previewTotals.carbs}g</span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        具材: {dish.ingredients.map((ing) => `${ing.name}(${ing.amountGrams}g)`).join('、')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-800">{selectedDish.name}</h3>
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        {selectedDish.category}
                      </span>
                    </div>
                    {selectedDish.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{selectedDish.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDish(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-semibold"
                  >
                    別の料理を選ぶ
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mt-3 pt-3 border-t border-slate-200">
                  <Sliders size={14} className="text-orange-500" />
                  <span>材料と分量（g）の内訳（調整可能）</span>
                </div>

                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{ing.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold"
                          >
                            具材を抜く
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                          <span>{ing.calories} kcal</span>
                          <span>•</span>
                          <span className="text-orange-600">P:{ing.protein}g</span>
                          <span className="text-amber-600">F:{ing.fat}g</span>
                          <span className="text-sky-600">C:{ing.carbs}g</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={ing.amountGrams}
                          onChange={(e) => handleGramsChange(idx, Number(e.target.value))}
                          className="w-18 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-right"
                        />
                        <span className="text-xs font-semibold text-slate-500">g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 合計サマリー ＆ 追加ボタン */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-orange-900">
                    調整後の合計栄養素（総重量: 約{dishTotals.weightGrams}g）
                  </span>
                  <span className="text-xl font-black text-slate-800">
                    {dishTotals.calories} <span className="text-xs font-bold text-slate-500">kcal</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-white/80 border border-orange-100 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-orange-600 block">P たんぱく質</span>
                    <span className="text-base font-black text-slate-800">{dishTotals.protein}g</span>
                  </div>
                  <div className="bg-white/80 border border-amber-100 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-amber-600 block">F 脂質</span>
                    <span className="text-base font-black text-slate-800">{dishTotals.fat}g</span>
                  </div>
                  <div className="bg-white/80 border border-sky-100 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-sky-600 block">C 炭水化物</span>
                    <span className="text-base font-black text-slate-800">{dishTotals.carbs}g</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddDish}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check size={18} />
                  <span>この内容で記録に追加</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
