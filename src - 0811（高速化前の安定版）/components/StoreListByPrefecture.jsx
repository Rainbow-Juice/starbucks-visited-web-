import React, { useEffect, useState } from "react";
import { query, where, getDocs } from "firebase/firestore";
import { storesCollection } from "../firebase";

async function fetchStoresByPrefecture(prefecture) {
  const q = query(storesCollection, where("prefecture", "==", prefecture));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export default function StoreListByPrefecture({ prefecture, onBack, onStoreSelect }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStoresByPrefecture(prefecture)
      .then((data) => {
        setStores(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [prefecture]);

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p style={{ color: "red" }}>エラー: {error}</p>;
  if (stores.length === 0) return <p>該当する店舗がありません。</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{prefecture}の店舗一覧</h2>
      <button onClick={onBack} style={{ marginBottom: 16, cursor: "pointer" }}>
        ← 戻る
      </button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {stores.map((store) => (
          <li
            key={store.id}
            style={{
              cursor: "pointer",
              padding: "6px 0",
              borderBottom: "1px solid #ccc",
            }}
            onClick={() => onStoreSelect(store)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onStoreSelect(store);
              }
            }}
            aria-label={`${store.name}（${store.city || "不明"}）`}
          >
            {store.name} ({store.city || "不明"}) {store.visited && "✅"}
          </li>
        ))}
      </ul>
    </div>
  );
}
