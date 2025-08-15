// src/utils/dataIO.js
import { saveAs } from "file-saver";
import {
  deleteAllStores,
  overwriteStoresFromJSON,
  getStoreCount, // ← 追加（Aggregate Query）
} from "../firebase";
import initialStores from "../data/initialStores.json";

// ===== 共通ユーティリティ =====
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * 共通オーケストレーター：
 * 1) 削除前件数
 * 2) 全削除（内部に再試行あり／firebase側実装）
 * 3) 削除直後件数
 * 4) 書き込み（バッチ／再試行あり）
 * 5) 完了後件数
 * → メトリクスを返却（UIでalert/表示）
 */
async function resetAndWrite(storesArray) {
  const t0 = performance.now();

  const countBefore = await getStoreCount();

  // 全削除（firebase側でリトライ込み）
  await deleteAllStores();

  const afterDelete = await getStoreCount();

  // 念のためのガード：0でなければ例外
  if (afterDelete !== 0) {
    throw new Error(`削除後の件数が0ではありません（${afterDelete}）`);
  }

  let written = 0;
  if (Array.isArray(storesArray) && storesArray.length > 0) {
    await overwriteStoresFromJSON(storesArray);
    written = storesArray.length;
  }

  const countAfterWrite = await getStoreCount();

  const t1 = performance.now();
  const durationMs = Math.round(t1 - t0);

  // deleteAllStores内部の試行回数や削除合計は取得不能なため、概算値だけ整形
  // 必要なら firebase.deleteAllStores を拡張してメトリクスを返す設計に変更可
  const metrics = {
    countBefore,
    afterDelete,
    countAfterWrite,
    deleteAttempts: undefined, // 取得しない
    totalDeleted: countBefore, // 近似（実際には差分が出る場合あり）
    written,
    durationMs,
  };
  return metrics;
}

/**
 * JSON形式で店舗データをエクスポートし、ファイルをダウンロードする
 * （成功/失敗のアラートはこの関数内で従来どおり表示）
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

    localStorage.setItem("backup", dataStr);
    localStorage.setItem("backupTime", new Date().toISOString());

    alert("JSONファイルをエクスポートしました");
  } catch (error) {
    alert("JSONエクスポートに失敗しました: " + error.message);
  }
}

/**
 * CSV形式で店舗データをエクスポート
 * （成功/失敗のアラートはこの関数内で従来どおり表示）
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
 * ファイルからJSONまたはCSVデータを読み込み → 全削除 → 書き込み
 * UIでの通知は呼び出し元（Settings.jsx）で実施
 * @returns {Promise<null|{data: Array, metrics: object}>}
 */
export function importFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
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
          alert("対応していないファイル形式です（JSONかCSV）");
          reject(new Error("非対応ファイル形式"));
          return;
        }

        if (!Array.isArray(data)) {
          alert("データ形式が不正です。配列形式である必要があります。");
          reject(new Error("データ形式不正"));
          return;
        }

        for (const store of data) {
          if (!store.id) {
            alert("インポートするデータにidがありません。");
            reject(new Error("idなしデータが含まれています"));
            return;
          }
        }

        // ローカルにバックアップ（任意）
        localStorage.setItem("backup", JSON.stringify(data));
        localStorage.setItem("backupTime", new Date().toISOString());

        // 共通処理（全削除→書き込み→件数メトリクス）
        const metrics = await resetAndWrite(data);

        resolve({ data, metrics });
      } catch (error) {
        alert("ファイル読み込み・解析に失敗しました: " + error.message);
        reject(error);
      }
    };

    input.click();
  });
}

/**
 * ローカルバックアップから復元 → 全削除 → 書き込み
 * UIでの通知は呼び出し元（Settings.jsx）で実施
 * @returns {Promise<null|{data: Array, metrics: object}>}
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

    const metrics = await resetAndWrite(data);
    return { data, metrics };
  } catch (error) {
    alert("バックアップ復元に失敗しました: " + error.message);
    throw error;
  }
}

/**
 * 初期データでFirestoreをリセット（全削除＋上書き）
 * UIでの通知は呼び出し元（Settings.jsx）で実施
 * @param {Function} setStoresCallback
 * @param {Array} initialData
 */
export async function resetData(setStoresCallback, initialData = initialStores) {
  const metrics = await resetAndWrite(initialData);
  if (typeof setStoresCallback === "function") {
    setStoresCallback(initialData);
    // レンダリングの安定化のため少し待つ（任意）
    await sleep(0);
  }
  return metrics;
}

/**
 * バックアップファイル保存（ローカルに保存）
 * （成功/失敗のアラートはこの関数内で従来どおり表示）
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

export function getBackupTimestamp() {
  return localStorage.getItem("backupTime") || "";
}

/**
 * 簡易CSVパース
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
      } catch {}
      obj[key] = val;
    });

    return obj;
  });
}
