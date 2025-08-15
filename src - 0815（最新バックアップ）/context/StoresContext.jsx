import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchStores, addStore as firebaseAddStore } from "../firebase";

export const StoresContext = createContext();

export const StoresProvider = ({ children }) => {
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem("stores");
    return saved ? JSON.parse(saved) : [];
  });

  const [lastMetrics, setLastMetrics] = useState(() => {
    const saved = localStorage.getItem("lastMetrics");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- バッチ件数設定 ---
  const [batchSize, setBatchSize] = useState(() => {
    const saved = localStorage.getItem("batchSize");
    return saved ? Number(saved) : 100;
  });
  const updateBatchSize = (size) => {
    setBatchSize(size);
    localStorage.setItem("batchSize", size);
  };

  // --- 個別操作ログ ---
  const addOperationLog = ({ action, store, timestamp = new Date(), duration }) => {
    const log = { action, store, timestamp: timestamp.toLocaleString(), duration };
    const updatedLogs = [log, ...(lastMetrics || [])].slice(0, 20);
    setLastMetrics(updatedLogs);
    localStorage.setItem("lastMetrics", JSON.stringify(updatedLogs));
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
    const updated = [newReport, ...lastMetrics].slice(0, 20);
    setLastMetrics(updated);
    localStorage.setItem("lastMetrics", JSON.stringify(updated));
  };

  // --- データ取得 ---
  const refreshStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchStores();
      setStores(fetched);
      localStorage.setItem("stores", JSON.stringify(fetched));
    } catch (err) {
      console.error("データの再取得に失敗しました:", err);
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // --- 個別追加 ---
  const addStore = async (store) => {
    setLoading(true);
    try {
      const startTime = Date.now();
      await firebaseAddStore(store);
      setStores((prev) => [...prev, store]);
      localStorage.setItem("stores", JSON.stringify([...stores, store]));
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      addOperationLog({
        action: "店舗追加",
        store: store.name,
        duration: `${elapsedSec}秒`,
      });
    } catch (err) {
      console.error(err);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // --- バッチ追加 ---
  const batchAddStores = async (storeList, writeFunction) => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    const countBefore = stores.length;
    let written = 0;
    try {
      for (let i = 0; i < storeList.length; i += batchSize) {
        const batch = storeList.slice(i, i + batchSize);
        await writeFunction(batch);
        written += batch.length;
      }
      const updatedStores = [...stores, ...storeList];
      setStores(updatedStores);
      localStorage.setItem("stores", JSON.stringify(updatedStores));
      addOperationReport("バッチ追加", {
        countBefore,
        afterDelete: 0,
        written,
        countAfterWrite: updatedStores.length,
        durationMs: Date.now() - startTime,
      });
    } catch (err) {
      console.error("バッチ書き込みに失敗:", err);
      setError("バッチ書き込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("stores", JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    refreshStores();
  }, []);

  return (
    <StoresContext.Provider
      value={{
        stores,
        setStores,
        refreshStores,
        addStore,
        batchAddStores,
        loading,
        error,
        lastMetrics,
        addOperationLog,
        addOperationReport,
        batchSize,
        updateBatchSize,
      }}
    >
      {children}
    </StoresContext.Provider>
  );
};

export const useStores = () => useContext(StoresContext);
