import React, { useState, useRef } from 'react';
import { AppSettings } from '../types';
import { exportAllData, importAllData, appendMeals } from '../lib/storage';
import { X, Key, Download, Upload, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onDataReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataReload,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExport = () => {
    const dataStr = exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pfc_diet_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importAllData(content)) {
        alert('データを正常に復元しました！');
        onDataReload();
        onClose();
      } else {
        alert('バックアップファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">設定・データ管理</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Gemini APIキー設定 */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <Key size={16} className="text-orange-500" />
              <span>Google Gemini APIキー設定</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              栄養成分表示の写真・スクショから数値を全自動で高精度抽出するために使用します。
              キーはブラウザ内（LocalStorage）にのみ安全に保存され、外部サーバーには送信されません。
            </p>

            <form onSubmit={handleSaveKey} className="space-y-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono"
              />

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Google AI Studioで無料キーを取得</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                >
                  {isSaved ? <Check size={14} /> : null}
                  <span>{isSaved ? '保存完了' : 'APIキーを保存'}</span>
                </button>
              </div>
            </form>
          </div>

          <hr className="border-slate-100" />

          {/* データバックアップ & 復元 */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>バックアップ & 復元</span>
            </div>

            <p className="text-xs text-slate-500">
              食事記録や設定データはすべてブラウザ内に保存されています。JSONファイルとして書き出し・読み込みが可能です。
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="p-3 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={15} />
                <span>データをダウンロード</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload size={15} />
                <span>バックアップを復元</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            {/* テキスト貼り付けで追加/復元 */}
            <div className="pt-2">
              <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <summary className="font-bold text-slate-700 cursor-pointer select-none">
                  📋 JSONテキストを直接貼り付けて追加・復元
                </summary>
                <div className="mt-2.5 space-y-2">
                  <p className="text-[11px] text-slate-500">
                    チャットやバックアップからコピーしたJSONテキストを貼り付けて、食事記録を追加できます。
                  </p>
                  <textarea
                    id="paste-import-json"
                    rows={3}
                    placeholder='[{"date":"2026-10-06", "mealType":"lunch", ...}]'
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('paste-import-json') as HTMLTextAreaElement;
                        const val = el?.value?.trim();
                        if (!val) return;
                        try {
                          const parsed = JSON.parse(val);
                          if (Array.isArray(parsed)) {
                            appendMeals(parsed);
                            alert('食事記録を追加しました！');
                            onDataReload();
                            onClose();
                          } else if (parsed.meals || parsed.settings) {
                            if (importAllData(val)) {
                              alert('データを復元しました！');
                              onDataReload();
                              onClose();
                            }
                          } else {
                            alert('有効な食事データまたはバックアップデータではありません。');
                          }
                        } catch {
                          alert('JSONの解析に失敗しました。形式をご確認ください。');
                        }
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
                    >
                      データを反映する
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* GitHubリポジトリリンク */}
          <div className="text-center text-xs text-slate-400">
            <p className="mb-1 font-medium">GitHub Repository</p>
            <a
              href="https://github.com/tommun/diet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-orange-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>tommun / diet</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
