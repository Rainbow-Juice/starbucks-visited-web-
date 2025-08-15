// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getCountFromServer, // ← 追加
  query,
  limit,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import initialData from "./data/initialStores.json";

// --- Firebase設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyB8w2gDkqa9oy-AA2irddhKzvQ9RaZh85w",
  authDomain: "starbucks-visited-web-74a04.firebaseapp.com",
  projectId: "starbucks-visited-web-74a04",
  storageBucket: "starbucks-visited-web-74a04.appspot.com",
  messagingSenderId: "177917582689",
  appId: "1:177917582689:web:db861eb3a370c5f9b2f920",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storesCollection = collection(db, "stores");

// --- 待機ユーティリティ ---
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- 一時エラー判定 ---
function shouldRetry(error) {
  const msg = String(error?.code || error?.message || error).toLowerCase();
  return (
    msg.includes("unavailable") ||
    msg.includes("deadline") ||
    msg.includes("aborted") ||
    msg.includes("transient") ||
    msg.includes("retry") ||
    msg.includes("network") ||
    msg.includes("bloom")
  );
}

// --- リトライユーティリティ（指数バックオフ） ---
async function retryOperation(fn, retries = 5, baseDelayMs = 300) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastErr = error;
      if (i === retries - 1 || !shouldRetry(error)) break;
      const delay = baseDelayMs * Math.pow(2, i); // 300, 600, 1200, ...
      console.warn(`Firestore操作失敗 attempt ${i + 1}:`, error);
      await wait(delay);
    }
  }
  throw lastErr;
}

// --- Aggregate Queryによる件数取得（軽量） ---
export async function getStoreCount() {
  const snap = await retryOperation(() => getCountFromServer(storesCollection));
  return snap.data().count || 0;
}

// --- 全店舗取得（必要な場面のみ使用推奨） ---
export async function fetchStores() {
  const snapshot = await retryOperation(() => getDocs(storesCollection));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// --- 店舗操作 ---
export async function addStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => setDoc(docRef, store));
}

export async function updateStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => updateDoc(docRef, store));
}

export async function deleteStore(id) {
  const docRef = doc(db, "stores", id);
  await retryOperation(() => deleteDoc(docRef));
}

// --- バッチ登録（上書き）改良版 ---
export async function overwriteStoresFromJSON(jsonData) {
  if (!Array.isArray(jsonData)) {
    throw new Error("jsonDataは配列である必要があります");
  }
  const BATCH_SIZE = 500;      // Firestoreの上限に合わせる（必要に応じて250に）
  const INTER_DELAY_MS = 200;  // バッチ間待機

  for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
    const chunk = jsonData.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((store) => {
      if (!store?.id) return; // idが無ければスキップ
      const docRef = doc(db, "stores", String(store.id));
      batch.set(docRef, store, { merge: false });
    });
    await retryOperation(() => batch.commit(), 5, 300);
    await wait(INTER_DELAY_MS);
  }
}

// --- 全削除＋リトライ改良版（ページングで安全に削除） ---
export async function deleteAllStores(onProgress) {
  const PAGE_SIZE = 500;
  const INTER_DELAY_MS = 200;

  while (true) {
    // 小分けに取得してバッチ削除
    const pageSnap = await retryOperation(() =>
      getDocs(query(storesCollection, limit(PAGE_SIZE)))
    );
    if (pageSnap.empty) return;

    const batch = writeBatch(db);
    pageSnap.docs.forEach((d) => batch.delete(d.ref));
    await retryOperation(() => batch.commit(), 5, 300);

    if (typeof onProgress === "function") {
      onProgress(pageSnap.size, undefined);
    }

    await wait(INTER_DELAY_MS);
  }
}

// --- 初期化（互換API：必要であれば使用可） ---
export async function resetStoresToInitialData() {
  await deleteAllStores();
  await overwriteStoresFromJSON(initialData);
}

// --- インポート（互換API：必要であれば使用可） ---
export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        if (!file.name.endsWith(".json")) {
          reject(new Error("対応していないファイル形式です"));
          return;
        }
        const jsonData = JSON.parse(text);
        if (!Array.isArray(jsonData))
          throw new Error("JSONは配列形式である必要があります");
        jsonData.forEach((store) => {
          if (!store.id) throw new Error("店舗にidがありません");
        });
        await deleteAllStores();
        await overwriteStoresFromJSON(jsonData);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ファイル読み込みエラー"));
    reader.readAsText(file);
  });
}

// --- エクスポート（互換API：必要であれば使用可） ---
export async function exportJSON() {
  const stores = await fetchStores();
  const json = JSON.stringify(stores, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  return URL.createObjectURL(blob);
}

export async function exportCSV() {
  const stores = await fetchStores();
  if (stores.length === 0) throw new Error("データがありません");

  const keys = Object.keys(stores[0]);
  const csvRows = [
    keys.join(","),
    ...stores.map((store) =>
      keys.map((key) => JSON.stringify(store[key] ?? "")).join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  return URL.createObjectURL(blob);
}

// --- エクスポート対象 ---
export { db, auth, provider, storesCollection };
