import React, { useState } from 'react';
import { MealType, FoodItem } from '../types';
import { Plus, Trash2, SunMedium, Sun, Moon, Coffee, Image as ImageIcon, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MealListProps {
  items: FoodItem[];
  mealTypeMapping: Record<string, MealType>; // itemId -> mealType
  onOpenLogModal: (mealType: MealType) => void;
  onDeleteItem: (itemId: string) => void;
}

export const MealList: React.FC<MealListProps> = ({
  items,
  mealTypeMapping,
  onOpenLogModal,
  onDeleteItem,
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  const mealSections: { type: MealType; title: string; icon: React.ReactNode; color: string }[] = [
    { type: 'breakfast', title: '朝食', icon: <SunMedium size={18} className="text-amber-500" />, color: 'amber' },
    { type: 'lunch', title: '昼食', icon: <Sun size={18} className="text-orange-500" />, color: 'orange' },
    { type: 'dinner', title: '夕食', icon: <Moon size={18} className="text-indigo-500" />, color: 'indigo' },
    { type: 'snack', title: '間食・プロテイン', icon: <Coffee size={18} className="text-emerald-500" />, color: 'emerald' },
  ];

  // 食事タイプごとにアイテムを分類
  const groupedItems = mealSections.map((sec) => {
    const sectionItems = items.filter((item) => mealTypeMapping[item.id] === sec.type);
    const subtotal = sectionItems.reduce(
      (acc, cur) => {
        acc.calories += cur.calories || 0;
        acc.protein += cur.protein || 0;
        acc.fat += cur.fat || 0;
        acc.carbs += cur.carbs || 0;
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
    subtotal.protein = Math.round(subtotal.protein * 10) / 10;
    subtotal.fat = Math.round(subtotal.fat * 10) / 10;
    subtotal.carbs = Math.round(subtotal.carbs * 10) / 10;

    return {
      ...sec,
      items: sectionItems,
      subtotal,
    };
  });

  return (
    <div className="space-y-4">
      {groupedItems.map((group) => (
        <div
          key={group.type}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
        >
          {/* セクションヘッダー */}
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {group.icon}
              <h3 className="font-extrabold text-sm text-slate-800">{group.title}</h3>
              {group.items.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {group.subtotal.calories} kcal
                </span>
              )}
            </div>

            {/* PFC 小計バッジ */}
            {group.items.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
                <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                  P: {group.subtotal.protein}g
                </span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  F: {group.subtotal.fat}g
                </span>
                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  C: {group.subtotal.carbs}g
                </span>
              </div>
            )}

            <button
              onClick={() => onOpenLogModal(group.type)}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 shadow-2xs transition-all text-slate-700"
            >
              <Plus size={14} />
              <span>記録する</span>
            </button>
          </div>

          {/* アイテム一覧 */}
          {group.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              まだ記録がありません。「記録する」から主食や料理を追加してください
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {group.items.map((item) => {
                const isExpanded = expandedItemId === item.id;
                const hasIngredients = item.ingredients && item.ingredients.length > 0;

                return (
                  <div key={item.id} className="transition-colors hover:bg-slate-50/50">
                    <div className="px-4 py-3 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        {/* 画像サムネイル */}
                        {item.imageUrl ? (
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <span className="text-xs font-black text-slate-500">
                              {item.category === 'staple' ? '🍚' : item.category === 'dish' ? '🍲' : '🍽️'}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-800">{item.name}</span>
                            {item.category === 'staple' && (
                              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1 rounded-sm font-semibold">
                                主食
                              </span>
                            )}
                            {item.category === 'dish' && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded-sm font-semibold flex items-center gap-0.5">
                                <Layers size={10} /> 材料内訳有
                              </span>
                            )}
                            {item.imageUrl && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded-sm font-semibold flex items-center gap-0.5">
                                <ImageIcon size={10} /> 写真有
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-700">{item.calories} kcal</span>
                            <span>•</span>
                            <span className="text-orange-600">P:{item.protein}g</span>
                            <span className="text-amber-600">F:{item.fat}g</span>
                            <span className="text-sky-600">C:{item.carbs}g</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* 材料内訳のアコーディオン展開ボタン */}
                        {hasIngredients && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 flex items-center gap-0.5 transition-all"
                            title="材料内訳を見る"
                          >
                            <span className="text-[11px] hidden sm:inline">内訳</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-all"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 材料内訳アコーディオン展開エリア */}
                    {hasIngredients && isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-slate-50/80 border-t border-slate-100 animate-in fade-in">
                        <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                          <Layers size={12} className="text-emerald-600" />
                          <span>構成材料と分量（何が何グラム入っているか）:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {item.ingredients!.map((ing, i) => (
                            <div
                              key={i}
                              className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-700">{ing.name}</span>
                              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                <span className="font-bold text-slate-800">{ing.amountGrams}g</span>
                                <span className="text-slate-300">|</span>
                                <span>{ing.calories}kcal</span>
                                <span className="text-orange-600 font-semibold">P:{ing.protein}g</span>
                                <span className="text-amber-600 font-semibold">F:{ing.fat}g</span>
                                <span className="text-sky-600 font-semibold">C:{ing.carbs}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
