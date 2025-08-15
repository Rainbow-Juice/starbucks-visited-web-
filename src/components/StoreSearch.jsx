import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCog, FaArrowLeft, FaQuestionCircle } from "react-icons/fa";
import { useStores } from "../context/StoresContext";
import { sortPrefecturesByCode } from "../utils/prefectures";

// ヘルプ用ツールチップ
function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const toggle = () => setVisible(v => !v);

  return (
    <span style={{ display: "inline-block", position: "relative", marginLeft: 6, cursor: "pointer" }}>
      <FaQuestionCircle
        color="#2e7d32"
        size={16}
        onClick={toggle}
        title="クリックで説明を表示／非表示"
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggle(); }}
      />
      {visible && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: 6,
          padding: 8,
          width: 260,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: 13,
          color: "#333",
          zIndex: 10,
          whiteSpace: "normal"
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

export default function StoreSearch() {
  const { stores } = useStores();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const initialPrefecture = params.get("prefecture") || "";

  const [selectedPrefecture, setSelectedPrefecture] = useState(initialPrefecture);
  const [selectedCity, setSelectedCity] = useState("");
  const [visitedOnly, setVisitedOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => { setSelectedCity(""); }, [selectedPrefecture]);

  // 都道府県リスト
  const prefectures = useMemo(() => {
    const set = new Set(stores.map(s => s.prefecture).filter(Boolean));
    return sortPrefecturesByCode(Array.from(set));
  }, [stores]);

  // 市区町村リスト（郵便番号順）
  const cities = useMemo(() => {
    if (!selectedPrefecture) return [];
    const filtered = stores
      .filter(s => s.prefecture === selectedPrefecture)
      .sort((a, b) => Number(a.zipcode) - Number(b.zipcode));
    const seen = new Set();
    const orderedCities = [];
    filtered.forEach(s => {
      if (s.city && !seen.has(s.city)) {
        seen.add(s.city);
        orderedCities.push(s.city);
      }
    });
    return orderedCities;
  }, [stores, selectedPrefecture]);

  // フィルタリング済み店舗リスト
  const filteredStores = useMemo(() => {
    const term = searchText.toLowerCase();
    const sortedPrefs = sortPrefecturesByCode([...new Set(stores.map(s => s.prefecture).filter(Boolean))]);
    return stores
      .filter(s => !selectedPrefecture || s.prefecture === selectedPrefecture)
      .filter(s => !selectedCity || s.city === selectedCity)
      .filter(s => !visitedOnly || s.visited)
      .filter(s => !favoriteOnly || s.favorite)
      .filter(s => showClosed || !s.closed)
      .filter(s => s.name?.toLowerCase().includes(term) || s.city?.toLowerCase().includes(term) || s.streetAddress?.toLowerCase().includes(term))
      .sort((a, b) => {
        const piA = sortedPrefs.indexOf(a.prefecture);
        const piB = sortedPrefs.indexOf(b.prefecture);
        if (piA !== piB) return piA - piB;
        return Number(a.zipcode) - Number(b.zipcode);
      });
  }, [stores, selectedPrefecture, selectedCity, visitedOnly, favoriteOnly, showClosed, searchText]);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif", fontSize: 16, color: "#333" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => navigate("/")} style={{ backgroundColor: "#2e7d32", color: "white", border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: "1.1em", display: "flex", alignItems: "center", gap: 8 }}>
          <FaArrowLeft /> ホーム
        </button>
        <button onClick={() => navigate("/settings")} style={{ backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: 6, padding: "10px 16px", fontSize: "1.4em", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="設定" title="設定">
          <FaCog />
        </button>
      </div>

      <h2 style={{ fontWeight: "bold", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        店舗検索
        <HelpTooltip text={<>都道府県や市区町村、訪問済み・お気に入りなどの条件で検索可能。<br />店舗をクリックで詳細画面に移動できます。</>} />
      </h2>

      {/* 検索窓 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="店舗名や住所で検索" style={{ flexGrow: 2, padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }} />
        {searchText && <button onClick={() => setSearchText("")} style={{ backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>×</button>}
      </div>

      {/* セレクタ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select value={selectedPrefecture} onChange={e => setSelectedPrefecture(e.target.value)} style={{ padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc", minWidth: 120, flexGrow: 1 }}>
          <option value="">すべての都道府県</option>
          {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedPrefecture} style={{ padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc", minWidth: 120, flexGrow: 1 }}>
          <option value="">すべての市区町村</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* フィルター */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={visitedOnly} onChange={e => setVisitedOnly(e.target.checked)} /> ✅訪問済み</label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={favoriteOnly} onChange={e => setFavoriteOnly(e.target.checked)} /> ⭐お気に入り</label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} /> 閉店も表示</label>
      </div>

      {/* 店舗リスト */}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {filteredStores.map(store => (
          <li key={store.id} style={{ padding: "10px 12px", borderBottom: "1.5px solid #ccc", cursor: "pointer", display: "flex", flexDirection: "column", fontSize: 16 }} onClick={() => navigate(`/store/${store.id}`)} tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate(`/store/${store.id}`); }}>
            <div style={{ fontWeight: "bold" }}>{store.name}</div>
            <div style={{ fontSize: 14, color: "#555" }}>{store.prefecture} {store.city} {store.streetAddress || ""}</div>
            {store.building && <div style={{ fontSize: 13, color: "#777" }}>{store.building}</div>}
          </li>
        ))}
        {filteredStores.length === 0 && <li style={{ textAlign: "center", padding: 16, color: "#777" }}>条件に一致する店舗はありません</li>}
      </ul>
    </div>
  );
}
