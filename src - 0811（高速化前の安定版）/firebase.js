// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storesCollection = collection(db, "stores");

// --- Firestore操作関数 ---

// リトライ用のユーティリティ
async function retryOperation(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Firestore操作失敗 attempt ${i + 1}:`, error);
      if (i === retries - 1) throw new Error("サーバーとの通信に失敗しました。時間をおいて再度お試しください。");
      // 少し待つ場合は以下を有効化可能
      // await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// 全店舗取得
export async function fetchStores() {
  const snapshot = await getDocs(storesCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// 店舗追加
export async function addStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => setDoc(docRef, store));
}

// 店舗更新
export async function updateStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => updateDoc(docRef, store));
}

// 店舗削除
export async function deleteStore(id) {
  const docRef = doc(db, "stores", id);
  await retryOperation(() => deleteDoc(docRef));
}

// --- エクスポート機能 ---

// JSONエクスポート
export async function exportJSON() {
  const stores = await fetchStores();
  const json = JSON.stringify(stores, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  return URL.createObjectURL(blob);
}

// CSVエクスポート
export async function exportCSV() {
  const stores = await fetchStores();
  if (stores.length === 0) throw new Error("データがありません");

  const keys = Object.keys(stores[0]);
  const csvRows = [
    keys.join(","), // ヘッダー
    ...stores.map((store) =>
      keys.map((key) => JSON.stringify(store[key] ?? "")).join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  return URL.createObjectURL(blob);
}

// --- データリセット（初期化） ---

export async function resetStoresToInitialData() {
  for (const store of initialData) {
    const docRef = doc(db, "stores", store.id);
    await setDoc(docRef, store);
  }
}

// --- インポート機能（JSONのみ対応） ---
export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        if (file.name.endsWith(".json")) {
          const jsonData = JSON.parse(text);
          if (!Array.isArray(jsonData)) throw new Error("JSONは配列形式である必要があります");
          for (const store of jsonData) {
            if (!store.id) throw new Error("店舗にidがありません");
            const docRef = doc(db, "stores", store.id);
            await setDoc(docRef, store);
          }
          resolve();
        } else if (file.name.endsWith(".csv")) {
          reject(new Error("CSVインポートは未実装です"));
        } else {
          reject(new Error("対応していないファイル形式です"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ファイル読み込みエラー"));
    reader.readAsText(file);
  });
}

// --- 開発用：全削除ユーティリティ（必要に応じて） ---
export async function deleteAllStores() {
  const snapshot = await getDocs(storesCollection);
  const deletions = snapshot.docs.map((docSnap) =>
    deleteDoc(doc(db, "stores", docSnap.id))
  );
  await Promise.all(deletions);
}

// --- エクスポート対象 ---
export {
  db,
  auth,
  provider,
  storesCollection,
};
