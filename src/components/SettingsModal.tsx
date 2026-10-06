import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { exportAllData, importAllData, appendMeals, USER_SPREADSHEET_URL, getFullSyncData, DEFAULT_SETTINGS } from '../lib/storage';
import { X, Key, Download, Upload, Check, ExternalLink, ShieldCheck, FileText, Copy, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { getMealHistoryByDate } from '../lib/storage';
import { GAS_TEMPLATE_CODE, syncSaveToSheets } from '../lib/sheetsSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onDataReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings = DEFAULT_SETTINGS,
  onSaveSettings,
  onDataReload,
}) => {
  const safeSettings = settings || DEFAULT_SETTINGS;
  const [apiKey, setApiKey] = useState(safeSettings.geminiApiKey || '');
  const [gasSyncUrl, setGasSyncUrl] = useState(safeSettings.gasSyncUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSavedGas, setIsSavedGas] = useState(false);
  const [isCopiedGas, setIsCopiedGas] = useState(false);
  const [isCopiedObsidian, setIsCopiedObsidian] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (safeSettings) {
      setApiKey(safeSettings.geminiApiKey || '');
      setGasSyncUrl(safeSettings.gasSyncUrl || '');
    }
  }, [safeSettings, isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...safeSettings,
      geminiApiKey: apiKey.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveGas = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...safeSettings,
      gasSyncUrl: gasSyncUrl.trim(),
      spreadsheetUrl: safeSettings.spreadsheetUrl || USER_SPREADSHEET_URL,
    });
    setIsSavedGas(true);
    setTimeout(() => setIsSavedGas(false), 2000);
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GAS_TEMPLATE_CODE).then(() => {
      setIsCopiedGas(true);
      setTimeout(() => setIsCopiedGas(false), 2500);
    });
  };

  const handleTestSync = async () => {
    if (!gasSyncUrl.trim()) {
      alert('先にGoogle Apps ScriptのウェブアプリURLを入力してください。');
      return;
    }
    setIsTestingSync(true);
    setSyncStatusMsg('スプレッドシートと通信中...');
    try {
      const fullData = getFullSyncData();
      const ok = await syncSaveToSheets(gasSyncUrl.trim(), fullData);
      if (ok) {
        setSyncStatusMsg('✅ スプレッドシートへの保存・同期に成功しました！');
        onSaveSettings({
          ...safeSettings,
          gasSyncUrl: gasSyncUrl.trim(),
          lastSyncedAt: new Date().toISOString(),
        });
      } else {
        setSyncStatusMsg('❌ スプレッドシートからの応答が不正です。');
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`❌ 同期失敗: ${e.message || 'CORSまたは権限設定をご確認ください'}`);
    } finally {
      setIsTestingSync(false);
    }
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

  const generateObsidianMarkdown = (): string => {
    try {
      const days = getMealHistoryByDate() || [];
      let md = `---\ntitle: PFC Diet 食事ログ (Obsidian連携)\nexported: ${new Date().toISOString()}\ntags:\n  - diet\n  - pfc\n---\n\n# 🥗 PFC Diet 食事ログ\n\n`;
      
      if (days.length === 0) {
        md += `*まだ食事の記録がありません*\n`;
        return md;
      }

      days.forEach((day) => {
        md += `## 📅 ${day.date}\n\n`;
        md += `- **総摂取**: **${day.totalCalories || 0} kcal** (P: ${day.totalProtein || 0}g / F: ${day.totalFat || 0}g / C: ${day.totalCarbs || 0}g)\n\n`;
        
        (day.meals || []).forEach((meal) => {
          const mealName =
            meal.mealType === 'breakfast' ? '🌅 朝食' :
            meal.mealType === 'lunch' ? '☀️ 昼食' :
            meal.mealType === 'dinner' ? '🌙 夕食' : '☕ 間食';
          md += `### ${mealName}\n`;
          (meal.items || []).forEach((item) => {
            md += `- **${item.name}**${item.weightGrams ? ` (${item.weightGrams}g)` : ''}: ${Math.round(item.calories || 0)} kcal (P: ${item.protein || 0}g, F: ${item.fat || 0}g, C: ${item.carbs || 0}g)\n`;
          });
          md += `\n`;
        });
        md += `---\n\n`;
      });

      return md;
    } catch (e) {
      console.error('Failed to generate obsidian markdown', e);
      return '# PFC Diet 食事ログ\n\nエラーが発生しました。';
    }
  };


  const handleCopyObsidian = () => {
    const md = generateObsidianMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      setIsCopiedObsidian(true);
      setTimeout(() => setIsCopiedObsidian(false), 2500);
    });
  };

  const handleDownloadObsidian = () => {
    const md = generateObsidianMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pfc_diet_obsidian_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
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

          {/* Google スプレッドシート同期設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Google スプレッドシート同期 (クラウド保存)</span>
              </div>
              <a
                href={safeSettings.spreadsheetUrl || USER_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <span>スプシを開く</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Googleスプレッドシートと連携すると、PC・スマホ・Safariなど<strong>どのブラウザから開いてもデータが自動同期</strong>され、消えなくなります！
            </p>

            <form onSubmit={handleSaveGas} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Google Apps Script (GAS) ウェブアプリ URL
              </label>
              <input
                type="text"
                value={gasSyncUrl}
                onChange={(e) => setGasSyncUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-slate-800"
              />

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleTestSync}
                  disabled={isTestingSync || !gasSyncUrl.trim()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                >
                  <RefreshCw size={13} className={isTestingSync ? 'animate-spin' : ''} />
                  <span>{isTestingSync ? '同期中...' : '今すぐ同期テスト'}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                >
                  {isSavedGas ? <Check size={14} /> : null}
                  <span>{isSavedGas ? 'URL保存完了' : '同期URLを保存'}</span>
                </button>
              </div>

              {syncStatusMsg && (
                <div className={`p-2 rounded-lg text-xs font-semibold ${
                  syncStatusMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {syncStatusMsg}
                </div>
              )}
            </form>

            {/* GAS設定手順の案内 */}
            <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <summary className="font-bold text-slate-700 cursor-pointer select-none flex items-center justify-between">
                <span>📖 スプレッドシート連携コードと設定手順</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">簡単3ステップ</span>
              </summary>
              <div className="mt-2.5 space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    スプレッドシートのメニューから <strong>「拡張機能」&gt;「Apps Script」</strong> を開きます。
                  </li>
                  <li>
                    下のボタンからコードをコピーし、エディタの内容を全消去して貼り付けて保存（Ctrl+S）します。
                  </li>
                  <li>
                    右上の <strong>「デプロイ」&gt;「新しいデプロイ」</strong> を押し、種類で <strong>「ウェブアプリ」</strong> を選択。アクセスできるユーザーを <strong>「全員」</strong> にして「デプロイ」をクリックし、表示されたURLを上の入力欄に貼り付けます。
                  </li>
                </ol>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs shadow-2xs"
                  >
                    {isCopiedGas ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedGas ? 'GASコードをコピーしました！' : '連携用GASコードをコピー'}</span>
                  </button>
                </div>
              </div>
            </details>
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

          {/* Obsidian連携 */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <FileText size={16} className="text-purple-600" />
              <span>Obsidian 連携 (Markdown出力)</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              これまでの食事履歴・PFCバランスをObsidianで美しく管理できるMarkdown形式で出力します。
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyObsidian}
                className="p-3 border border-purple-200 hover:border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-xl text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 transition-all"
              >
                {isCopiedObsidian ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                <span>{isCopiedObsidian ? 'コピー完了！' : 'Markdownをコピー'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadObsidian}
                className="p-3 border border-purple-200 hover:border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-xl text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={15} />
                <span>.mdファイルを保存</span>
              </button>
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
