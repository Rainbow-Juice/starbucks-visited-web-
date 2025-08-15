import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
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

// 待機用ユーティリティ
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// リトライ用のユーティリティ
async function retryOperation(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Firestore操作失敗 attempt ${i + 1}:`, error);
      if (i === retries - 1)
        throw new Error(
          "サーバーとの通信に失敗しました。時間をおいて再度お試しください。"
        );
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

// 店舗追加（単一）
export async function addStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => setDoc(docRef, store));
}

// 店舗更新（単一）
export async function updateStore(store) {
  const docRef = doc(db, "stores", store.id);
  await retryOperation(() => updateDoc(docRef, store));
}

// 店舗削除（単一）
export async function deleteStore(id) {
  const docRef = doc(db, "stores", id);
  await retryOperation(() => deleteDoc(docRef));
}

// バッチ登録（上書き）
// 500件ずつのバッチ処理で高速化
export async function overwriteStoresFromJSON(jsonData) {
  if (!Array.isArray(jsonData)) {
    throw new Error("jsonDataは配列である必要があります");
  }

  const batchSize = 500;
  for (let i = 0; i < jsonData.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = jsonData.slice(i, i + batchSize);
    chunk.forEach((store) => {
      const docRef = doc(db, "stores", store.id);
      batch.set(docRef, store);
    });
    await batch.commit();
  }
}

// バッチ削除（全件削除） 改良版（リトライ・分割・待機・進捗通知対応）
// onProgress(deletedCount, totalCount) - 進捗コールバック（省略可能）
export async function deleteAllStores(onProgress) {
  const maxRetries = 2;      // リトライ回数
  const batchSize = 500;
  const waitMs = 300;        // バッチ間の待機時間

  let attempt = 0;

  while (attempt <= maxRetries) {
    console.log(`【deleteAllStores】削除試行回数: ${attempt + 1}`);

    const snapshot = await getDocs(storesCollection);
    const docs = snapshot.docs;

    if (docs.length === 0) {
      console.log("【deleteAllStores】削除対象なし。処理完了。");
      return;
    }

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();

      if (typeof onProgress === "function") {
        onProgress(Math.min(i + batchSize, docs.length), docs.length);
      }

      await wait(waitMs);  // 少し待つことでFirebase負荷を軽減
    }

    // 削除後、再チェック
    const remainingSnapshot = await getDocs(storesCollection);
    const remainingCount = remainingSnapshot.size;

    console.log(`【deleteAllStores】削除後の残件数: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log("【deleteAllStores】全件削除完了");
      return;
    } else {
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(
          `削除に失敗しました。残件数: ${remainingCount} 件。`
        );
      }
      // 少し待ってからリトライ
      await wait(1000);
    }
  }
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
  // 初期化は一旦全削除してから初期データをバッチ登録
  await deleteAllStores();

  const batchSize = 500;
  for (let i = 0; i < initialData.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = initialData.slice(i, i + batchSize);
    chunk.forEach((store) => {
      const docRef = doc(db, "stores", store.id);
      batch.set(docRef, store);
    });
    await batch.commit();
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
          if (!Array.isArray(jsonData))
            throw new Error("JSONは配列形式である必要があります");
          for (const store of jsonData) {
            if (!store.id) throw new Error("店舗にidがありません");
          }

          // バッチ書き込みで一括登録（高速化）
          const batchSize = 500;
          for (let i = 0; i < jsonData.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = jsonData.slice(i, i + batchSize);
            chunk.forEach((store) => {
              const docRef = doc(db, "stores", store.id);
              batch.set(docRef, store);
            });
            await batch.commit();
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

// --- エクスポート対象 ---
export { db, auth, provider, storesCollection };
