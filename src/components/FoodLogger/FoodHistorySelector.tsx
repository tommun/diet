import React, { useState, useMemo } from 'react';
import { FoodItem } from '../../types';
import { getRecentFoodHistory } from '../../lib/storage';
import { History, Search, Plus, Star, Calendar, Flame } from 'lucide-react';

interface FoodHistorySelectorProps {
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  favorites: Omit<FoodItem, 'id' | 'createdAt'>[];
  onToggleFavorite: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
}

export const FoodHistorySelector: React.FC<FoodHistorySelectorProps> = ({
  onAddFoodItem,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 過去の食事履歴（最新順）
  const historyList = useMemo(() => {
    return getRecentFoodHistory(80);
  }, []);

  // 検索フィルタリング
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return historyList;
    const q = searchQuery.toLowerCase().trim();
    return historyList.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      (item.restaurantName && item.restaurantName.toLowerCase().includes(q))
    );
  }, [historyList, searchQuery]);

  const isFavorite = (name: string) => {
    return favorites.some((f) => f.name.trim() === name.trim());
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4">
      {/* 検索入力欄 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="過去に食べた料理・食材を履歴から探す..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* 履歴リスト */}
      {filteredList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <History className="mx-auto mb-2 text-slate-300" size={32} />
          <p className="text-sm font-bold text-slate-600">
            {searchQuery ? '一致する過去の履歴がありません' : 'まだ過去の食事履歴がありません'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            食事を記録すると、食べたメニューが自動的にここに履歴として蓄積され、ワンタップで再利用できるようになります。
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
            <span>最近食べた履歴 ({filteredList.length}件)</span>
            <span className="text-[11px]">ワンタップで今日に追加</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {filteredList.map((item, idx) => {
              const fav = isFavorite(item.name);
              return (
                <div
                  key={`${item.name}_${idx}`}
                  className="p-3 bg-white hover:bg-orange-50/40 rounded-xl border border-slate-200/90 hover:border-orange-200 shadow-2xs transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm truncate">
                        {item.name}
                      </span>
                      {item.weightGrams ? (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {item.weightGrams}g
                        </span>
                      ) : null}
                      {item.lastEatenDate && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Calendar size={10} />
                          {formatDateLabel(item.lastEatenDate)}
                        </span>
                      )}
                      {item.count && item.count > 1 ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded-full">
                          {item.count}回
                        </span>
                      ) : null}
                    </div>

                    {/* PFCバッジ */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
                      <span className="font-extrabold text-slate-700 flex items-center gap-0.5">
                        <Flame size={12} className="text-orange-500" />
                        {Math.round(item.calories)} kcal
                      </span>
                      <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded-sm">
                        P: {item.protein}g
                      </span>
                      <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded-sm">
                        F: {item.fat}g
                      </span>
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-sm">
                        C: {item.carbs}g
                      </span>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item)}
                      title={fav ? 'お気に入りから外す' : 'お気に入りに登録'}
                      className={`p-2 rounded-xl transition-all ${
                        fav
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                      }`}
                    >
                      <Star size={16} fill={fav ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddFoodItem(item)}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>追加</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
