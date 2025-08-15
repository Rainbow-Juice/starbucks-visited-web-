// src/utils/dataIO.js
import { saveAs } from "file-saver";
import {
  fetchStores,
  deleteAllStores,
  overwriteStoresFromJSON,
} from "../firebase";
import initialStores from "../data/initialStores.json";

/**
 * JSON形式で店舗データをエクスポートし、ファイルをダウンロードする
 * @param {Array} stores
 */
export function exportToJSON(stores) {
  if (!stores || stores.length === 0) {
    alert("エクスポートできるデータがありません");
    return;
  }

  try {
    const dataStr = JSON.stringify(stores, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    saveAs(blob, "Stores.json");

    // ローカルストレージにバックアップを保存
    localStorage.setItem("backup", dataStr);
    localStorage.setItem("backupTime", new Date().toISOString());

    alert("JSONファイルをエクスポートしました");
  } catch (error) {
    alert("JSONエクスポートに失敗しました: " + error.message);
  }
}

/**
 * CSV形式で店舗データをエクスポートし、ファイルをダウンロードする
 * @param {Array} stores
 */
export function exportToCSV(stores) {
  if (!stores || stores.length === 0) {
    alert("エクスポートできるデータがありません");
    return;
  }

  const header = [
    "id",
    "name",
    "zipcode",
    "prefecture",
    "city",
    "streetAddress",
    "building",
    "visited",
    "visitDate",
    "visitCount",
    "favorite",
    "closed",
    "memo",
  ];

  try {
    const rows = stores.map((store) =>
      header
        .map((key) => {
          const val = store[key] ?? "";
          // CSV用に値をダブルクォーテーションで囲み、内部のダブルクォーテーションはエスケープ
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, "Stores.csv");

    alert("CSVファイルをエクスポートしました");
  } catch (error) {
    alert("CSVエクスポートに失敗しました: " + error.message);
  }
}

/**
 * ファイルからJSONまたはCSVデータを読み込み
 * @returns {Promise<null|Array>} キャンセル時は null、成功時は配列データを返す
 */
export function importFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null); // キャンセル時は null を返す
        return;
      }

      try {
        const text = await file.text();
        let data;

        if (file.name.toLowerCase().endsWith(".csv")) {
          data = parseCSV(text);
        } else if (file.name.toLowerCase().endsWith(".json")) {
          data = JSON.parse(text);
        } else {
          alert(
            "対応していないファイル形式です（JSONかCSVを選択してください）"
          );
          reject(new Error("非対応ファイル形式"));
          return;
        }

        if (!Array.isArray(data)) {
          alert(
            "データ形式が不正です。配列形式のJSONまたはCSVを選択してください。"
          );
          reject(new Error("データ形式不正"));
          return;
        }

        for (const store of data) {
          if (!store.id) {
            alert("インポートするデータにidがありません。");
            reject(new Error("idなしのデータが含まれています"));
            return;
          }
        }

        localStorage.setItem("backup", JSON.stringify(data));
        localStorage.setItem("backupTime", new Date().toISOString());

        resolve(data);
      } catch (error) {
        alert("ファイル読み込み・解析に失敗しました: " + error.message);
        reject(error);
      }
    };

    input.click();
  });
}

/**
 * ローカルストレージのバックアップから復元する（データを返す）
 * @returns {Promise<null|Array>} バックアップがなければ null、あれば配列データ
 */
export async function restoreBackup() {
  const backup = localStorage.getItem("backup");
  if (!backup) {
    alert("復元できるバックアップがありません");
    return null;
  }

  try {
    const data = JSON.parse(backup);
    if (!Array.isArray(data)) {
      alert("バックアップデータの形式が不正です");
      throw new Error("バックアップデータ形式不正");
    }
    return data;
  } catch (error) {
    alert("バックアップ復元に失敗しました: " + error.message);
    throw error;
  }
}

/**
 * 初期データ（initialStores）でアプリのデータをリセットする
 * Firestoreの状態を途中でログ出力します。
 * @param {Function} setStoresCallback
 * @param {Array} initialData - 初期データ（省略時はinitialStores.json）
 * @param {Function} onProgress - 削除進捗コールバック（deletedCount, totalCount）
 * @returns {Promise<void>}
 */
export async function resetData(setStoresCallback, initialData = initialStores, onProgress) {
  try {
    // 初期化前のFirestoreデータ件数（あれば）
    const beforeStores = await fetchStores();
    console.log("【リセット処理：初期化前のFirestore店舗件数】", beforeStores.length);

    // 既存データ全削除
    await deleteAllStores(onProgress);
    const afterDeleteStores = await fetchStores();
    console.log("【リセット処理：削除後のFirestore店舗件数】", afterDeleteStores.length);

    // 初期データ上書き
    await overwriteStoresFromJSON(initialData);
    const afterWriteStores = await fetchStores();
    console.log("【リセット処理：初期データ書き込み後のFirestore店舗件数】", afterWriteStores.length);

    setStoresCallback(initialData);
  } catch (error) {
    alert("リセットに失敗しました: " + error.message);
    throw error;
  }
}

/**
 * バックアップをファイルに保存する
 * @param {Array} stores
 */
export function backupData(stores) {
  if (!stores || stores.length === 0) {
    alert("保存するデータがありません");
    return;
  }

  try {
    const dataStr = JSON.stringify(stores, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    saveAs(blob, `backup-${timestamp}.json`);

    localStorage.setItem("backupTime", timestamp);
    alert("バックアップを保存しました");
  } catch (error) {
    alert("バックアップ保存に失敗しました: " + error.message);
  }
}

/**
 * ローカルストレージからバックアップ日時を取得する
 * @returns {string}
 */
export function getBackupTimestamp() {
  return localStorage.getItem("backupTime") || "";
}

/**
 * 簡易的なCSVパース関数（ダブルクォーテーション囲み対応）
 * @param {string} text CSVテキスト
 * @returns {Array<Object>}
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const rows = lines.slice(1);

  const headers = headerLine.split(",");

  return rows.map((row) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj = {};
    headers.forEach((key, idx) => {
      let val = values[idx] ?? "";
      try {
        val = JSON.parse(val);
      } catch {
        // 失敗したら文字列のまま
      }
      obj[key] = val;
    });

    return obj;
  });
}
