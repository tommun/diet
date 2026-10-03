import React, { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Check, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { extractNutritionFromImage } from '../../lib/geminiOcr';
import { FoodItem } from '../../types';

interface PhotoUploaderProps {
  apiKey?: string;
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  onOpenSettings: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  apiKey,
  onAddFoodItem,
  onOpenSettings,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム用入力値
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [note, setNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // クリップボードからの貼り付け (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileSelect(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      // 画像選択時に自動で名前の初期値をセット
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, "") || '成分表示食品');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Gemini APIで栄養成分表示画像をパース
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    if (!apiKey) {
      setError('Gemini APIキーが設定されていません。右上の「APIキー設定」から入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await extractNutritionFromImage(selectedImage, mimeType, apiKey);
      if (result.name) setName(result.name);
      setCalories(result.calories);
      setProtein(result.protein);
      setFat(result.fat);
      setCarbs(result.carbs);
      if (result.confidenceNote) setNote(result.confidenceNote);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '成分表示の解析に失敗しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 決定して食事に追加
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('食品名を入力してください');
      return;
    }

    onAddFoodItem({
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      imageUrl: selectedImage || undefined,
      category: 'packaged'
    });
  };

  return (
    <div className="space-y-4">
      {/* 説明文 */}
      <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <Sparkles size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">確実・正確なPFC管理：</span>
          <p className="mt-0.5 text-amber-800">
            商品裏面の「栄養成分表示」の写真やECサイトのスクショを取り込むと、実数値をそのまま記録できます。
            {apiKey ? '（AI自動読み取り対応中）' : '（画像を見ながら数字をサクッと確認・入力できます）'}
          </p>
        </div>
      </div>

      {/* 画像選択エリア */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左側：画像プレビュー & アップローダー */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {!selectedImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[240px]"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                <Camera size={24} />
              </div>
              <p className="font-bold text-sm text-slate-700 mb-1">
                写真・スクショを選択 またはドラッグ
              </p>
              <p className="text-xs text-slate-400">
                クリップボードから貼り付け（Ctrl+V）も対応
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center min-h-[240px] max-h-[320px]">
              <img
                src={selectedImage}
                alt="成分表示プレビュー"
                className="max-h-[300px] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setError(null);
                }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all"
              >
                写真を変更
              </button>
            </div>
          )}

          {/* AI解析ボタン */}
          {selectedImage && (
            <div className="mt-2.5">
              {apiKey ? (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>成分表をAI解析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>写真からPFCとカロリーを自動抽出</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <KeyRound size={14} className="text-slate-400" />
                    AI自動抽出を利用するにはAPIキーが必要です
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="text-orange-600 hover:underline font-bold"
                  >
                    設定する
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右側：実数値入力・確認フォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {note && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-medium">
                抽出メモ: {note}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                商品名 / メモ
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: セブン 特製カルボナーラ"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  エネルギー (kcal)
                </label>
                <input
                  type="number"
                  step="any"
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
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check size={18} />
            <span>この数値を記録に追加</span>
          </button>
        </form>
      </div>
    </div>
  );
};
