import { AppSettings, MealRecord, FoodItem, WeightRecord } from '../types';

export interface FullSyncData {
  settings: AppSettings;
  meals: MealRecord[];
  favorites: Omit<FoodItem, 'id' | 'createdAt'>[];
  weights: WeightRecord[];
  exportedAt: string;
}

/**
 * Google Apps Script (GAS) Webアプリから最新データを取得
 */
export async function syncLoadFromSheets(gasUrl: string): Promise<FullSyncData | null> {
  if (!gasUrl || !gasUrl.trim()) return null;

  try {
    const cleanUrl = gasUrl.trim();
    // キャッシュ防止用のタイムスタンプパラメータを付与
    const urlWithTs = cleanUrl.includes('?') 
      ? `${cleanUrl}&t=${Date.now()}` 
      : `${cleanUrl}?t=${Date.now()}`;

    const res = await fetch(urlWithTs, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const json = await res.json();
    if (json && (json.meals || json.settings)) {
      return json as FullSyncData;
    }
    return null;
  } catch (error) {
    console.error('Failed to load data from Google Sheets GAS:', error);
    throw error;
  }
}

/**
 * Google Apps Script (GAS) Webアプリへデータを保存・同期
 */
export async function syncSaveToSheets(gasUrl: string, data: FullSyncData): Promise<boolean> {
  if (!gasUrl || !gasUrl.trim()) return false;

  try {
    const cleanUrl = gasUrl.trim();
    const payload = JSON.stringify(data);

    // Preflight (OPTIONS) を回避するため Content-Type を text/plain で送信
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
      mode: 'cors',
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const result = await res.json();
    return result?.success === true;
  } catch (error) {
    console.error('Failed to save data to Google Sheets GAS:', error);
    throw error;
  }
}

/**
 * ユーザーがGoogle Apps Scriptに貼り付けるテンプレートコード
 */
export const GAS_TEMPLATE_CODE = `/**
 * PFC Diet × Google スプレッドシート クラウド同期スクリプト
 * 
 * 【設定手順】
 * 1. スプレッドシート上部「拡張機能」>「Apps Script」を開く
 * 2. このコードをすべて貼り付けて保存（Ctrl+S）
 * 3. 右上「デプロイ」>「新しいデプロイ」をクリック
 * 4. 種類の選択（歯車アイコン）>「ウェブアプリ」を選択
 * 5. 設定：
 *    - 次のユーザーとして実行: 「自分」
 *    - アクセスできるユーザー: 「全員」 (Anyone) ※重要
 * 6. 「デプロイ」を押し、表示された「ウェブアプリ URL」をコピーしてアプリの設定に貼り付け！
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var syncSheet = ss.getSheetByName("SyncData");
    if (!syncSheet) {
      syncSheet = ss.insertSheet("SyncData");
      syncSheet.hideSheet();
    }
    
    var jsonStr = syncSheet.getRange("A1").getValue();
    if (!jsonStr) {
      return ContentService.createTextOutput(JSON.stringify({ meals: [], settings: null }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. SyncDataシートにまるごとJSON保存
    var syncSheet = ss.getSheetByName("SyncData");
    if (!syncSheet) {
      syncSheet = ss.insertSheet("SyncData");
      syncSheet.hideSheet();
    }
    syncSheet.getRange("A1").setValue(contents);
    
    // 2. 「🍽️ 食事ログ」シートに展開
    updateMealsSheet(ss, data.meals || []);
    
    // 3. 「📊 日別サマリー」シートに展開
    updateDailySummarySheet(ss, data.meals || [], data.weights || []);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, savedAt: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateMealsSheet(ss, meals) {
  var sheet = ss.getSheetByName("🍽️ 食事ログ");
  if (!sheet) {
    sheet = ss.insertSheet("🍽️ 食事ログ", 0);
  }
  sheet.clear();
  
  var headers = ["日付", "食事区分", "品目名", "重量(g)", "カロリー (kcal)", "タンパク質 P(g)", "脂質 F(g)", "炭水化物 C(g)", "登録日時"];
  var rows = [headers];
  
  // 日付順（新しい順）
  var sortedMeals = meals.slice().sort(function(a, b) {
    return (b.date || "").localeCompare(a.date || "");
  });
  
  sortedMeals.forEach(function(m) {
    var mealTypeName = m.mealType === "breakfast" ? "朝食" :
                       m.mealType === "lunch" ? "昼食" :
                       m.mealType === "dinner" ? "夕食" : "間食";
    (m.items || []).forEach(function(item) {
      rows.push([
        m.date,
        mealTypeName,
        item.name,
        item.weightGrams || "",
        Math.round(item.calories),
        item.protein,
        item.fat,
        item.carbs,
        item.createdAt || ""
      ]);
    });
  });
  
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#ea580c")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}

function updateDailySummarySheet(ss, meals, weights) {
  var sheet = ss.getSheetByName("📊 日別サマリー");
  if (!sheet) {
    sheet = ss.insertSheet("📊 日別サマリー", 1);
  }
  sheet.clear();
  
  var headers = ["日付", "総カロリー (kcal)", "タンパク質 P(g)", "脂質 F(g)", "炭水化物 C(g)", "体重 (kg)", "体脂肪率 (%)", "品目数"];
  var rows = [headers];
  
  // 日付マップ作成
  var map = {};
  meals.forEach(function(m) {
    var d = m.date;
    if (!map[d]) {
      map[d] = { cal: 0, p: 0, f: 0, c: 0, count: 0 };
    }
    (m.items || []).forEach(function(item) {
      map[d].cal += item.calories;
      map[d].p += item.protein;
      map[d].f += item.fat;
      map[d].c += item.carbs;
      map[d].count += 1;
    });
  });
  
  var dates = Object.keys(map).sort().reverse();
  dates.forEach(function(d) {
    var summary = map[d];
    var w = weights.find(function(x) { return x.date === d; });
    rows.push([
      d,
      Math.round(summary.cal),
      Math.round(summary.p * 10) / 10,
      Math.round(summary.f * 10) / 10,
      Math.round(summary.c * 10) / 10,
      w ? w.weight : "",
      w && w.bodyFat ? w.bodyFat : "",
      summary.count
    ]);
  });
  
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#0284c7")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}
`;

