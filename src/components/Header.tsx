import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, Target, UtensilsCrossed } from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenTargetSettings: () => void;
  onOpenStaplesConfig: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onOpenTargetSettings,
  onOpenStaplesConfig,
  onOpenSettings,
}) => {
  // 日付の前日・翌日移動
  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const isToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return currentDate === `${yyyy}-${mm}-${dd}`;
  };

  // 表示用フォーマット (例: 10月3日 (土))
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}月${d.getDate()}日 (${weekDays[d.getDay()]})`;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* ロゴ・アプリ名 */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black text-lg">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 tracking-tight text-lg">PFC Diet</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">私ナイズ</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">実測写真＆重量クイック管理</p>
          </div>
        </div>

        {/* 日付ナビゲーション */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-slate-700 text-sm">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded-md transition-all text-slate-600"
            title="前日"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="px-2 font-semibold text-xs sm:text-sm flex items-center gap-1">
            <Calendar size={14} className="text-slate-500 hidden sm:inline" />
            <span>{formatDisplayDate(currentDate)}</span>
            {isToday() && (
              <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
                今日
              </span>
            )}
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded-md transition-all text-slate-600"
            title="翌日"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 設定・ツールボタン */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenTargetSettings}
            className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="目標PFC設定"
          >
            <Target size={18} />
            <span className="hidden md:inline">目標設定</span>
          </button>

          <button
            onClick={onOpenStaplesConfig}
            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="主食の基準値カスタマイズ"
          >
            <UtensilsCrossed size={18} />
            <span className="hidden md:inline">主食基準</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="設定 / バックアップ / APIキー"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
