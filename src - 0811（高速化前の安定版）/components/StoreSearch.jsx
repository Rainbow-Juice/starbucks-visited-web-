import React, { useState, useMemo, useEffect } from "react";
import { sortPrefecturesByCode } from "../utils/prefectures";
import { FaCog, FaArrowLeft, FaQuestionCircle } from "react-icons/fa";

function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);

  return (
    <span style={{ display: "inline-block", position: "relative", marginLeft: 6, cursor: "pointer" }}>
      <FaQuestionCircle
        color="#2e7d32"
        size={16}
        onClick={() => setVisible(!visible)}
        title="クリックで説明を表示／非表示"
        aria-label="ヘルプ説明トグル"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setVisible(!visible);
        }}
      />
      {visible && (
        <div style={{
          position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
          marginTop: 6, padding: 8, width: 260, backgroundColor: "#fff", border: "1px solid #ccc",
          borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13, color: "#333", zIndex: 10,
          whiteSpace: "normal"
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

function StoreSearch({ stores, onBack, onStoreSelect, initialPrefecture, onSettingsOpen }) {
  const [selectedPrefecture, setSelectedPrefecture] = useState(initialPrefecture || "");
  const [selectedCity, setSelectedCity] = useState("");
  const [visitedOnly, setVisitedOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setSelectedCity("");
  }, [selectedPrefecture]);

  const prefectures = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => s.prefecture && set.add(s.prefecture));
    return sortPrefecturesByCode(Array.from(set));
  }, [stores]);

  const cities = useMemo(() => {
    const targetStores = stores
      .filter((s) => s.prefecture === selectedPrefecture)
      .sort((a, b) => a.zipcode.localeCompare(b.zipcode));
    const seen = new Set();
    const orderedCities = [];
    targetStores.forEach((s) => {
      if (s.city && !seen.has(s.city)) {
        seen.add(s.city);
        orderedCities.push(s.city);
      }
    });
    return orderedCities;
  }, [stores, selectedPrefecture]);

  const filteredStores = useMemo(() => {
    const term = searchText.toLowerCase();

    // ここで都道府県コード順、市区町村の郵便番号順でソート
    const sortedPrefectures = sortPrefecturesByCode(
      Array.from(new Set(stores.map((s) => s.prefecture).filter(Boolean)))
    );

    return stores
      .filter((store) => !selectedPrefecture || store.prefecture === selectedPrefecture)
      .filter((store) => !selectedCity || store.city === selectedCity)
      .filter((store) => !visitedOnly || store.visited)
      .filter((store) => !favoriteOnly || store.favorite)
      .filter((store) => showClosed || !store.closed)
      .filter((store) => {
        return (
          store.name?.toLowerCase().includes(term) ||
          store.city?.toLowerCase().includes(term) ||
          store.streetAddress?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // 都道府県コード順で比較
        const prefIndexA = sortedPrefectures.indexOf(a.prefecture);
        const prefIndexB = sortedPrefectures.indexOf(b.prefecture);
        if (prefIndexA !== prefIndexB) {
          return prefIndexA - prefIndexB;
        }
        // 都道府県が同じなら郵便番号順で比較
        return a.zipcode.localeCompare(b.zipcode);
      });
  }, [stores, selectedPrefecture, selectedCity, visitedOnly, favoriteOnly, showClosed, searchText]);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif", fontSize: 16, color: "#333" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={() => onBack()}
          style={{
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "1.1em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FaArrowLeft style={{ marginRight: 10 }} />
          戻る
        </button>
        <button
          onClick={onSettingsOpen}
          style={{
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: "1.4em",
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="設定"
          title="設定"
        >
          <FaCog />
        </button>
      </div>

      {/* タイトルと説明 */}
      <h2 style={{ fontWeight: "bold", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        店舗検索
        <HelpTooltip text={<>都道府県や市区町村、訪問済み・お気に入りなどの条件で店舗を絞り込んで検索できます。<br />店舗をタップすると店舗情報の表示と、訪問情報を入力することができます。</>} />
      </h2>

      {/* 検索窓 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="店舗名や住所で検索"
          style={{ flexGrow: 2, padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
        />
        {searchText && (
          <button
            onClick={() => setSearchText("")}
            style={{ backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}
          >
            ×
          </button>
        )}
      </div>

      {/* セレクタ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select
          value={selectedPrefecture}
          onChange={(e) => setSelectedPrefecture(e.target.value)}
          style={{ padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc", minWidth: 120, flexGrow: 1 }}
        >
          <option value="">すべての都道府県</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{ padding: "8px 12px", fontSize: 16, borderRadius: 6, border: "1px solid #ccc", minWidth: 120, flexGrow: 1 }}
          disabled={!selectedPrefecture}
        >
          <option value="">すべての市区町村</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* フィルター */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24, fontSize: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={visitedOnly} onChange={(e) => setVisitedOnly(e.target.checked)} />
          ✅訪問済み
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={favoriteOnly} onChange={(e) => setFavoriteOnly(e.target.checked)} />
          ⭐お気に入り
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          ❌閉店店舗も表示
        </label>
      </div>

      {/* 店舗リスト */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filteredStores.map((store) => (
          <li
            key={store.id}
            onClick={() => onStoreSelect(store)}
            style={{ cursor: "pointer", borderBottom: "1px solid #ddd", padding: "14px 12px", fontSize: 16 }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onStoreSelect(store);
            }}
            role="button"
          >
            <div style={{ fontWeight: "bold", display: "flex", alignItems: "center" }}>
              {store.name}
              <span style={{ marginLeft: 12, fontSize: 18 }}>
                {store.visited && "✅"}{store.favorite && "⭐"}{store.closed && <span style={{ color: "red", marginLeft: 6 }}>❌</span>}
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
              {store.prefecture} {store.city} {store.streetAddress}
              {store.building && <><br />{store.building}</>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StoreSearch;
