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
  getCountFromServer,
  query,
  limit,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import initialData from "./data/initialStores.json";

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function retryOperation(fn, retries = 5, baseDelayMs = 300) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastErr = error;
      if (i === retries - 1 || !shouldRetry(error)) break;
      const delay = baseDelayMs * Math.pow(2, i);
      console.warn(`Firestore操作失敗 attempt ${i + 1}:`, error);
      await wait(delay);
    }
  }
  throw lastErr;
}

export async function getStoreCount() {
  const snap = await retryOperation(() => getCountFromServer(storesCollection));
  return snap.data().count || 0;
}

export async function fetchStores() {
  const snapshot = await retryOperation(() => getDocs(storesCollection));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

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

// --- 新規追加：batchAddStores ---
export async function batchAddStores(storesArray) {
  if (!Array.isArray(storesArray) || storesArray.length === 0) return;
  const BATCH_SIZE = 500;
  for (let i = 0; i < storesArray.length; i += BATCH_SIZE) {
    const chunk = storesArray.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((store) => {
      if (!store?.id) return;
      const docRef = doc(db, "stores", store.id);
      batch.set(docRef, store, { merge: false });
    });
    await retryOperation(() => batch.commit(), 5, 300);
    await wait(200); // バッチ間待機
  }
}

// 上書き用バッチ（既存API互換）
export async function overwriteStoresFromJSON(jsonData) {
  await batchAddStores(jsonData);
}

export async function deleteAllStores(onProgress) {
  const PAGE_SIZE = 500;
  while (true) {
    const pageSnap = await retryOperation(() =>
      getDocs(query(storesCollection, limit(PAGE_SIZE)))
    );
    if (pageSnap.empty) return;
    const batch = writeBatch(db);
    pageSnap.docs.forEach((d) => batch.delete(d.ref));
    await retryOperation(() => batch.commit(), 5, 300);
    if (typeof onProgress === "function") onProgress(pageSnap.size, undefined);
    await wait(200);
  }
}

export async function resetStoresToInitialData() {
  await deleteAllStores();
  await overwriteStoresFromJSON(initialData);
}

export { db, auth, provider, storesCollection };
