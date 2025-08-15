import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchStores } from "../firebase";

// --- Context 作成 ---
export const StoresContext = createContext();

// --- Provider ---
export const StoresProvider = ({ children }) => {
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem("stores");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Firebase から最新データを取得して同期
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

  // localStorage 更新（stores が変わったとき）
  useEffect(() => {
    localStorage.setItem("stores", JSON.stringify(stores));
  }, [stores]);

  // 初回ロード時に Firebase から取得
  useEffect(() => {
    refreshStores();
  }, []);

  return (
    <StoresContext.Provider value={{ stores, setStores, refreshStores, loading, error }}>
      {children}
    </StoresContext.Provider>
  );
};

// --- カスタムフック ---
export const useStores = () => useContext(StoresContext);