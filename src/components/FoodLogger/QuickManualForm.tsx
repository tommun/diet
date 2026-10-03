import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { Star, Check, Trash2 } from 'lucide-react';

interface QuickManualFormProps {
  favorites: Omit<FoodItem, 'id' | 'createdAt'>[];
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onSaveFavorite: (fav: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onDeleteFavorite: (name: string) => void;
}

export const QuickManualForm: React.FC<QuickManualFormProps> = ({
  favorites,
  onAddFoodItem,
  onSaveFavorite,
  onDeleteFavorite,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [saveAsFav, setSaveAsFav] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // お気に入りから選んだ時
  const handleSelectFavorite = (fav: Omit<FoodItem, 'id' | 'createdAt'>) => {
    setName(fav.name);
    setCalories(fav.calories);
    setProtein(fav.protein);
    setFat(fav.fat);
    setCarbs(fav.carbs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('食品名を入力してください');
      return;
    }

    const item: Omit<FoodItem, 'id' | 'createdAt'> = {
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      category: 'custom'
    };

    if (saveAsFav) {
      onSaveFavorite(item);
    }

    onAddFoodItem(item);
  };

  return (
    <div className="space-y-4">
      {/* マイ食品（お気に入り）一覧 */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              マイ食品・お気に入り（タップで自動入力）
            </label>
          </div>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            {favorites.map((fav) => (
              <div
                key={fav.name}
                className="group flex items-center bg-white border border-slate-200 hover:border-orange-400 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all text-xs"
              >
                <button
                  type="button"
                  onClick={() => handleSelectFavorite(fav)}
                  className="font-bold text-slate-700 hover:text-orange-600 text-left mr-2"
                >
                  {fav.name}
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {fav.calories}kcal (P:{fav.protein} F:{fav.fat} C:{fav.carbs})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteFavorite(fav.name)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-0.5"
                  title="お気に入りから削除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 手動入力フォーム */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            食品名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: プロテインバー、ゆで卵 2個 など"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              カロリー (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-700 mb-1">
              たんぱく質 P (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.0"
              className="w-full px-3 py-2 text-sm rounded-xl border border-orange-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-orange-50/30 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-700 mb-1">
              脂質 F (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.0"
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-amber-50/30 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sky-700 mb-1">
              炭水化物 C (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.0"
              className="w-full px-3 py-2 text-sm rounded-xl border border-sky-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-sky-50/30 font-bold"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="saveAsFav"
            checked={saveAsFav}
            onChange={(e) => setSaveAsFav(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
          />
          <label htmlFor="saveAsFav" className="text-xs font-semibold text-slate-700 cursor-pointer">
            ★ この食品を「マイ食品（お気に入り）」に保存して次回も使う
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all mt-4"
        >
          <Check size={18} />
          <span>食事に追加</span>
        </button>
      </form>
    </div>
  );
};
