// src/context/StoresContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { getFirebaseApp } from "../firebase"; // Firebase 初期化済みファイル

export const StoresContext = createContext();

export const StoresProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastMetrics, setLastMetrics] = useState([]);
  const [batchSize, setBatchSize] = useState(100);

  const db = getFirestore(getFirebaseApp());
  const storesCol = collection(db, "stores");

  // --- 個別操作ログ ---
  const addOperationLog = ({ action, store, timestamp = new Date(), duration }) => {
    const log = { action, store, timestamp: timestamp.toLocaleString(), duration };
    setLastMetrics(prev => [log, ...prev].slice(0, 20));
  };

  // --- バッチ／統計レポート ---
  const addOperationReport = (operation, metrics) => {
    const formatDuration = (ms) => {
      if (ms == null) return "-";
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
    };

    const newReport = {
      操作内容: operation,
      処理前件数: metrics.countBefore ?? "-",
      削除後件数: metrics.afterDelete ?? "-",
      書き込み件数: metrics.written ?? "-",
      書き込み後件数: metrics.countAfterWrite ?? "-",
      所要時間: formatDuration(metrics.durationMs),
      実行日時: new Date().toLocaleString(),
    };
    setLastMetrics(prev => [newReport, ...prev].slice(0, 20));
  };

  // --- Firestore からデータを取得（リアルタイム更新） ---
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      storesCol,
      snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStores(data);
        setLoading(false);
      },
      err => {
        console.error("Firestore 取得エラー:", err);
        setError("Firestore からのデータ取得に失敗しました");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- Firestore 書き込み操作 ---
  const addStore = async (store) => {
    const start = performance.now();
    try {
      const docRef = await addDoc(storesCol, store);
      addOperationLog({ action: "追加", store: store.name, duration: performance.now() - start });
      return docRef.id;
    } catch (err) {
      console.error("Firestore 追加エラー:", err);
      setError("データ追加に失敗しました");
      return null;
    }
  };

  const updateStore = async (id, updatedFields) => {
    const start = performance.now();
    try {
      const docRef = doc(db, "stores", id);
      await updateDoc(docRef, updatedFields);
      addOperationLog({ action: "更新", store: updatedFields.name || id, duration: performance.now() - start });
    } catch (err) {
      console.error("Firestore 更新エラー:", err);
      setError("データ更新に失敗しました");
    }
  };

  const deleteStore = async (id) => {
    const start = performance.now();
    try {
      const docRef = doc(db, "stores", id);
      await deleteDoc(docRef);
      addOperationLog({ action: "削除", store: id, duration: performance.now() - start });
    } catch (err) {
      console.error("Firestore 削除エラー:", err);
      setError("データ削除に失敗しました");
    }
  };

  return (
    <StoresContext.Provider
      value={{
        stores,
        setStores,
        loading,
        error,
        lastMetrics,
        addOperationLog,
        addOperationReport,
        addStore,
        updateStore,
        deleteStore,
        batchSize,
        updateBatchSize: setBatchSize,
      }}
    >
      {children}
    </StoresContext.Provider>
  );
};

export const useStores = () => useContext(StoresContext);
