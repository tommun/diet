import React, { useState, useMemo } from 'react';
import { WeightRecord, UserProfile } from '../../types';
import { calculateBodyFatPercentage, calculateBMI } from '../../lib/bodyFatCalculator';
import { X, Check, TrendingDown, TrendingUp, Trash2, Plus, Zap, User, Settings2 } from 'lucide-react';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  weightRecords: WeightRecord[];
  targetWeight?: number;
  profile?: UserProfile;
  onSaveWeight: (record: Omit<WeightRecord, 'id' | 'createdAt'>) => void;
  onDeleteWeight: (recordId: string) => void;
  onSaveProfile?: (profile: UserProfile) => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  weightRecords,
  targetWeight = 62,
  profile = { heightCm: 170, age: 30, gender: 'male' },
  onSaveWeight,
  onDeleteWeight,
  onSaveProfile,
}) => {
  // 入力フォーム用ステート
  const [inputDate, setInputDate] = useState<string>(currentDate);
  const existingRecordForDate = weightRecords.find((r) => r.date === inputDate);

  const [weight, setWeight] = useState<number | ''>(existingRecordForDate?.weight || '');
  const [bodyFat, setBodyFat] = useState<number | ''>(existingRecordForDate?.bodyFat || '');
  const [note, setNote] = useState<string>(existingRecordForDate?.note || '');

  // プロフィール用ステート
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 170);
  const [age, setAge] = useState<number>(profile.age || 30);
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender || 'male');
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // グラフ表示期間フィルター: '7d' | '30d' | '90d' | 'all'
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    weight: number;
    diff?: number;
    x: number;
    y: number;
  } | null>(null);

  // 日付が変更されたら、その日の既存レコードがあれば入力欄に反映
  const handleDateChange = (newDate: string) => {
    setInputDate(newDate);
    const rec = weightRecords.find((r) => r.date === newDate);
    if (rec) {
      setWeight(rec.weight);
      setBodyFat(rec.bodyFat || '');
      setNote(rec.note || '');
    } else {
      const latest = weightRecords[weightRecords.length - 1];
      if (latest) {
        setWeight(latest.weight);
      }
    }
  };

  // プロフィールの保存
  const handleSaveProfileData = () => {
    if (onSaveProfile) {
      onSaveProfile({
        heightCm: Number(heightCm) || 170,
        age: Number(age) || 30,
        gender,
      });
    }
    setShowProfileEdit(false);
  };

  // 体重に基づくリアルタイムBMIと体脂肪率推定
  const currentBMI = useMemo(() => {
    if (!weight || !heightCm) return 0;
    return calculateBMI(Number(weight), heightCm);
  }, [weight, heightCm]);

  const estimatedBodyFat = useMemo(() => {
    if (!weight || !heightCm || !age) return 0;
    return calculateBodyFatPercentage(Number(weight), heightCm, age, gender);
  }, [weight, heightCm, age, gender]);

  // 体脂肪率のワンタップ自動適用
  const handleApplyEstimatedBodyFat = () => {
    if (estimatedBodyFat > 0) {
      setBodyFat(estimatedBodyFat);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    onSaveWeight({
      date: inputDate,
      weight: Number(weight),
      bodyFat: bodyFat !== '' ? Number(bodyFat) : undefined,
      note: note.trim() || undefined,
    });
  };

  // 期間に応じたグラフデータの抽出
  const filteredRecords = useMemo(() => {
    if (weightRecords.length === 0) return [];
    const sorted = [...weightRecords].sort((a, b) => a.date.localeCompare(b.date));

    if (period === 'all') return sorted;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return sorted.filter((r) => r.date >= cutoffStr);
  }, [weightRecords, period]);

  // 最新体重と前日比
  const latestRecord = weightRecords[weightRecords.length - 1];
  const previousRecord = weightRecords.length > 1 ? weightRecords[weightRecords.length - 2] : null;
  const dayDiff = latestRecord && previousRecord
    ? Math.round((latestRecord.weight - previousRecord.weight) * 10) / 10
    : null;

  // 目標体重までの残り
  const diffToTarget = latestRecord
    ? Math.round((latestRecord.weight - targetWeight) * 10) / 10
    : null;

  // ----------------------------------------------------
  // SVGグラフ描画用の座標計算
  // ----------------------------------------------------
  const graphDimensions = { width: 500, height: 220, padding: 35 };

  const graphData = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    const weights = filteredRecords.map((r) => r.weight);
    if (targetWeight) weights.push(targetWeight);

    const minWeight = Math.floor(Math.min(...weights) - 0.5);
    const maxWeight = Math.ceil(Math.max(...weights) + 0.5);
    const weightRange = maxWeight - minWeight || 1;

    const { width, height, padding } = graphDimensions;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const points = filteredRecords.map((r, i) => {
      const x =
        filteredRecords.length === 1
          ? width / 2
          : padding + (i / (filteredRecords.length - 1)) * usableWidth;
      const y = height - padding - ((r.weight - minWeight) / weightRange) * usableHeight;

      const prev = i > 0 ? filteredRecords[i - 1] : null;
      const diff = prev ? Math.round((r.weight - prev.weight) * 10) / 10 : undefined;

      return { x, y, record: r, diff };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    const targetY =
      targetWeight
        ? height - padding - ((targetWeight - minWeight) / weightRange) * usableHeight
        : null;

    return {
      points,
      pathD,
      areaD,
      targetY,
      minWeight,
      maxWeight,
    };
  }, [filteredRecords, targetWeight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              体重・体脂肪推移グラフ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* サマリーカード */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">最新の体重</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {latestRecord ? `${latestRecord.weight}` : '--'}
                <span className="text-xs font-bold text-slate-500 ml-0.5">kg</span>
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">前回比</span>
              <div className="flex items-center justify-center gap-0.5">
                {dayDiff !== null ? (
                  <>
                    {dayDiff > 0 ? (
                      <TrendingUp size={16} className="text-rose-500" />
                    ) : (
                      <TrendingDown size={16} className="text-emerald-500" />
                    )}
                    <span
                      className={`text-xl sm:text-2xl font-black ${
                        dayDiff > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {dayDiff > 0 ? `+${dayDiff}` : `${dayDiff}`}
                      <span className="text-xs font-bold text-slate-500 ml-0.5">kg</span>
                    </span>
                  </>
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-slate-400">--</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">目標まで (目標 {targetWeight}kg)</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {diffToTarget !== null ? (
                  <span className={diffToTarget > 0 ? 'text-orange-600' : 'text-emerald-600'}>
                    {diffToTarget > 0 ? `あと -${diffToTarget}` : '目標達成!'}
                  </span>
                ) : (
                  '--'
                )}
                {diffToTarget !== null && diffToTarget > 0 && (
                  <span className="text-xs font-bold text-slate-500 ml-0.5">kg</span>
                )}
              </span>
            </div>
          </div>

          {/* 折れ線グラフセクション */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>体重推移グラフ</span>
                {filteredRecords.length > 0 && (
                  <span className="text-[10px] text-slate-400">({filteredRecords.length}日分のデータ)</span>
                )}
              </span>

              {/* 期間切り替えボタン */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                {(['7d', '30d', '90d', 'all'] as const).map((p) => {
                  const labelMap = { '7d': '7日間', '30d': '1ヶ月', '90d': '3ヶ月', all: '全期間' };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        period === p
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {labelMap[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVGグラフ本体 */}
            {graphData && graphData.points.length > 0 ? (
              <div className="relative w-full overflow-hidden select-none">
                <svg
                  viewBox={`0 0 ${graphDimensions.width} ${graphDimensions.height}`}
                  className="w-full h-auto"
                >
                  <defs>
                    <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line
                    x1={graphDimensions.padding}
                    y1={graphDimensions.padding}
                    x2={graphDimensions.width - graphDimensions.padding}
                    y2={graphDimensions.padding}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <line
                    x1={graphDimensions.padding}
                    y1={graphDimensions.height - graphDimensions.padding}
                    x2={graphDimensions.width - graphDimensions.padding}
                    y2={graphDimensions.height - graphDimensions.padding}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  {/* 目標体重ライン */}
                  {graphData.targetY !== null && (
                    <g>
                      <line
                        x1={graphDimensions.padding}
                        y1={graphData.targetY}
                        x2={graphDimensions.width - graphDimensions.padding}
                        y2={graphData.targetY}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={graphDimensions.width - graphDimensions.padding - 4}
                        y={graphData.targetY - 4}
                        textAnchor="end"
                        fontSize="9"
                        fill="#059669"
                        fontWeight="bold"
                      >
                        目標 {targetWeight}kg
                      </text>
                    </g>
                  )}

                  {graphData.areaD && (
                    <path d={graphData.areaD} fill="url(#weightAreaGrad)" />
                  )}

                  {graphData.pathD && (
                    <path
                      d={graphData.pathD}
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {graphData.points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#ffffff"
                      stroke="#ea580c"
                      strokeWidth="2.5"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          date: pt.record.date,
                          weight: pt.record.weight,
                          diff: pt.diff,
                          x: pt.x,
                          y: pt.y,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}

                  <text
                    x={graphDimensions.padding}
                    y={graphDimensions.height - 10}
                    fontSize="9"
                    fill="#94a3b8"
                    fontWeight="bold"
                  >
                    {filteredRecords[0]?.date.slice(5)}
                  </text>
                  <text
                    x={graphDimensions.width - graphDimensions.padding}
                    y={graphDimensions.height - 10}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    fontWeight="bold"
                  >
                    {filteredRecords[filteredRecords.length - 1]?.date.slice(5)}
                  </text>
                </svg>

                {hoveredPoint && (
                  <div
                    className="absolute z-10 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full mb-2 font-bold"
                    style={{
                      left: `${(hoveredPoint.x / graphDimensions.width) * 100}%`,
                      top: `${(hoveredPoint.y / graphDimensions.height) * 100}%`,
                    }}
                  >
                    <div className="text-[10px] text-slate-300 font-medium">
                      {hoveredPoint.date}
                    </div>
                    <div className="text-sm">
                      {hoveredPoint.weight} kg
                      {hoveredPoint.diff !== undefined && (
                        <span
                          className={`ml-1 text-[11px] ${
                            hoveredPoint.diff > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          ({hoveredPoint.diff > 0 ? `+${hoveredPoint.diff}` : hoveredPoint.diff})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl">
                体重データがまだ登録されていません。下のフォームから記録してください。
              </div>
            )}
          </div>

          {/* 身体プロフィール設定（身長・年齢・性別） */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User size={15} className="text-orange-600" />
                <span className="text-xs font-extrabold text-slate-800">
                  身体プロフィール（体脂肪率の自動推定に使用）
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {heightCm}cm / {age}歳 / {gender === 'male' ? '男性' : '女性'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Settings2 size={13} />
                <span>{showProfileEdit ? '閉じる' : '設定変更'}</span>
              </button>
            </div>

            {showProfileEdit && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      身長 (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      年齢
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      性別
                    </label>
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfileData}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>プロフィールを保存</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 体重入力フォーム */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Plus size={14} className="text-orange-600" />
                <span>体重を記録・更新</span>
              </span>
              {currentBMI > 0 && (
                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  BMI: {currentBMI}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  記録日
                </label>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  体重 (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="例: 64.5"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-800 focus:ring-2 focus:ring-orange-500/30"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    体脂肪率 (%)
                  </label>
                  {estimatedBodyFat > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyEstimatedBodyFat}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-0.5"
                      title="Deurenberg式で自動推定"
                    >
                      <Zap size={11} className="fill-orange-500 text-orange-500" />
                      <span>推定 {estimatedBodyFat}% を適用</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={estimatedBodyFat > 0 ? `推定: ${estimatedBodyFat}` : '例: 18.2'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                  />
                  {estimatedBodyFat > 0 && bodyFat === '' && (
                    <button
                      type="button"
                      onClick={handleApplyEstimatedBodyFat}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-0.5 rounded-md font-bold transition-colors"
                    >
                      自動計算
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="メモ（例: 朝起きてすぐ、夕食前など）"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />

              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
              >
                <Check size={14} />
                <span>保存する</span>
              </button>
            </div>
          </form>

          {/* 過去ログ一覧 */}
          {weightRecords.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">記録履歴（最新10件）</div>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200">
                {[...weightRecords]
                  .reverse()
                  .slice(0, 10)
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{rec.date}</span>
                        <span className="font-black text-slate-800 text-sm">{rec.weight} kg</span>
                        {rec.bodyFat && (
                          <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md text-[11px]">
                            {rec.bodyFat}%
                          </span>
                        )}
                        {rec.note && (
                          <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                            {rec.note}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteWeight(rec.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                        title="記録を削除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
