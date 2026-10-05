import React, { useState, useMemo } from 'react';
import { POPULAR_DISH_RECIPES, recalculateIngredient, sumRecipeIngredients } from '../../lib/recipeData';
import { POPULAR_CHAIN_MENU, CHAIN_RESTAURANTS_LIST } from '../../lib/chainRestaurants';
import { RecipeDish, Ingredient, FoodItem, ChainMenuItem } from '../../types';
import { decomposeDishRecipe, searchChainMenuItem } from '../../lib/geminiOcr';
import { Search, Sparkles, Check, Layers, RefreshCw, AlertCircle, Sliders, Store, Utensils } from 'lucide-react';

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
  // モード切り替え: 'chain' (チェーン店・公式値) or 'home' (家庭料理・材料内訳)
  const [subMode, setSubMode] = useState<'chain' | 'home'>('chain');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('すべて');

  // 家庭料理用のステート
  const [selectedDish, setSelectedDish] = useState<RecipeDish | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // チェーン店用の選択ステート
  const [selectedChainItem, setSelectedChainItem] = useState<ChainMenuItem | null>(null);

  // ローディング & エラー
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チェーン店メニューの絞り込み
  const filteredChainMenus = useMemo(() => {
    let list = POPULAR_CHAIN_MENU;
    if (selectedChainFilter !== 'すべて') {
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

  const handleAiSearchChain = async () => {
    if (!searchQuery.trim()) return;
    if (!apiKey) {
      setError('チェーン店のAI公式検索を利用するにはGemini APIキーが必要です。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const item = await searchChainMenuItem(searchQuery.trim(), apiKey);
      setSelectedChainItem(item);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'チェーン店メニューの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
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

  const handleAiDecompose = async () => {
    if (!searchQuery.trim()) return;
    if (!apiKey) {
      setError('AIレシピ分解を利用するにはGemini APIキーが必要です。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dish = await decomposeDishRecipe(searchQuery.trim(), apiKey);
      handleSelectDish(dish);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AIによるレシピ分解に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

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
          <span>チェーン店・外食 (公式公表PFC)</span>
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
          <span>家庭料理 (材料と分量g内訳)</span>
        </button>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            subMode === 'chain'
              ? '店名・メニュー名を検索（例: 吉野家 牛丼、サイゼ ドリア、マック ポテト）'
              : '料理名を検索（例: カルボナーラ、親子丼、生姜焼き...）'
          }
          className="w-full pl-10 pr-24 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white"
        />

        {/* AI検索・分解ボタン */}
        {searchQuery.trim() && (
          <button
            type="button"
            onClick={subMode === 'chain' ? handleAiSearchChain : handleAiDecompose}
            disabled={isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
            title={subMode === 'chain' ? 'AIで公式PFCを検索' : 'AIで材料とグラム数を推定分解'}
          >
            {isLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} className="text-orange-600" />
            )}
            <span>AI検索</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
          {!apiKey && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="font-bold underline ml-2 shrink-0"
            >
              設定する
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. チェーン店・外食モード                                 */}
      {/* ======================================================== */}
      {subMode === 'chain' && (
        <div className="space-y-4">
          {/* チェーン店クイックフィルター */}
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
                {chain}
              </button>
            ))}
          </div>

          {!selectedChainItem ? (
            /* チェーン店メニュー一覧 */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  {selectedChainFilter === 'すべて' ? '主要チェーン公式公表メニュー' : `${selectedChainFilter}のメニュー`}
                </label>
                <span className="text-[11px] text-slate-400">
                  {filteredChainMenus.length}件ヒット
                </span>
              </div>

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
                      <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                        {item.restaurant}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-1">
                      <span>{item.calories} kcal</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-orange-600">P:{item.protein}g</span>
                      <span className="text-amber-600">F:{item.fat}g</span>
                      <span className="text-sky-600">C:{item.carbs}g</span>
                    </div>

                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span>✓ {item.note || '公式公表値'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 選択されたチェーン店メニューの確認＆追加画面 */
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-orange-600 text-white px-2 py-0.5 rounded-md">
                      {selectedChainItem.restaurant}
                    </span>
                    <h3 className="font-black text-base text-slate-800">
                      {selectedChainItem.name}
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    ✓ {selectedChainItem.note || '公式公表値'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedChainItem(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-semibold"
                >
                  別のメニューを選ぶ
                </button>
              </div>

              {/* PFCカード */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/90 border border-orange-100 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold text-orange-600 block">P たんぱく質</span>
                  <span className="text-lg font-black text-slate-800">{selectedChainItem.protein}g</span>
                </div>
                <div className="bg-white/90 border border-amber-100 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold text-amber-600 block">F 脂質</span>
                  <span className="text-lg font-black text-slate-800">{selectedChainItem.fat}g</span>
                </div>
                <div className="bg-white/90 border border-sky-100 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold text-sky-600 block">C 炭水化物</span>
                  <span className="text-lg font-black text-slate-800">{selectedChainItem.carbs}g</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-extrabold text-slate-700">エネルギー</span>
                <span className="text-2xl font-black text-slate-800">
                  {selectedChainItem.calories} <span className="text-xs font-bold text-slate-500">kcal</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddChainItem}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check size={18} />
                <span>このメニューを記録に追加</span>
              </button>
            </div>
          )}
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
