// src/utils/dataIO.js
import { saveAs } from "file-saver";
import { deleteAllStores, batchAddStores, getStoreCount } from "../firebase";
import initialStores from "../data/initialStores.json";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function resetAndWrite(storesArray) {
  const t0 = performance.now();
  const countBefore = await getStoreCount();

  await deleteAllStores();
  const afterDelete = await getStoreCount();
  if (afterDelete !== 0) console.warn(`削除後件数が0ではありません（${afterDelete}）`);

  let written = 0;
  if (Array.isArray(storesArray) && storesArray.length > 0) {
    await batchAddStores(storesArray);
    written = storesArray.length;
  }

  const countAfterWrite = await getStoreCount();
  const t1 = performance.now();
  return { countBefore, afterDelete, countAfterWrite, written, durationMs: Math.round(t1 - t0) };
}

export function exportToJSON(stores) {
  if (!stores?.length) return alert("エクスポートできるデータがありません");
  try {
    const dataStr = JSON.stringify(stores, null, 2);
    saveAs(new Blob([dataStr], { type: "application/json" }), "Stores.json");
    localStorage.setItem("backup", dataStr);
    localStorage.setItem("backupTime", new Date().toISOString());
    alert("JSONファイルをエクスポートしました");
  } catch (error) {
    alert("JSONエクスポートに失敗しました: " + error.message);
  }
}

export function exportToCSV(stores) {
  if (!stores?.length) return alert("エクスポートできるデータがありません");
  const header = ["id","name","zipcode","prefecture","city","streetAddress","building","visited","visitDate","visitCount","favorite","closed","memo"];
  try {
    const rows = stores.map(store => header.map(key => `"${String(store[key] ?? "").replace(/"/g,'""')}"`).join(","));
    const csvContent = [header.join(","), ...rows].join("\n");
    saveAs(new Blob([csvContent], { type: "text/csv" }), "Stores.csv");
    alert("CSVファイルをエクスポートしました");
  } catch (error) {
    alert("CSVエクスポートに失敗しました: " + error.message);
  }
}

export function importFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const text = await file.text();
        let data;
        if (file.name.toLowerCase().endsWith(".csv")) data = parseCSV(text);
        else if (file.name.toLowerCase().endsWith(".json")) data = JSON.parse(text);
        else { alert("対応していないファイル形式です"); return reject(new Error("非対応")); }

        if (!Array.isArray(data)) { alert("データ形式が不正です"); return reject(new Error("形式不正")); }
        for (const store of data) if (!store.id) { alert("idなしデータが含まれています"); return reject(new Error("idなし")); }

        localStorage.setItem("backup", JSON.stringify(data));
        localStorage.setItem("backupTime", new Date().toISOString());
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

export async function restoreBackup() {
  const backup = localStorage.getItem("backup");
  if (!backup) { alert("復元できるバックアップがありません"); return null; }
  try {
    const data = JSON.parse(backup);
    if (!Array.isArray(data)) throw new Error("バックアップデータ形式不正");
    const metrics = await resetAndWrite(data);
    return { data, metrics };
  } catch (error) {
    alert("バックアップ復元に失敗しました: " + error.message);
    throw error;
  }
}

export async function resetData(setStoresCallback, initialData = initialStores) {
  const metrics = await resetAndWrite(initialData);
  if (typeof setStoresCallback === "function") { setStoresCallback(initialData); await sleep(0); }
  return metrics;
}

export function backupData(stores) {
  if (!stores?.length) return alert("保存するデータがありません");
  try {
    const dataStr = JSON.stringify(stores, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    saveAs(new Blob([dataStr], { type: "application/json" }), `backup-${timestamp}.json`);
    localStorage.setItem("backupTime", timestamp);
    alert("バックアップを保存しました");
  } catch (error) {
    alert("バックアップ保存に失敗しました: " + error.message);
  }
}

export function getBackupTimestamp() { return localStorage.getItem("backupTime") || ""; }

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map(row => {
    const values = [];
    let current = "", inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i+1]==='"') { current+='"'; i++; } else inQuotes=!inQuotes;
      } else if (char === "," && !inQuotes) { values.push(current); current=""; } else current+=char;
    }
    values.push(current);
    const obj = {};
    headers.forEach((key, idx) => { try { obj[key]=JSON.parse(values[idx]??""); } catch { obj[key]=values[idx]??""; } });
    return obj;
  });
}
