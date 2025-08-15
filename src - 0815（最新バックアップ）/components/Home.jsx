import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaQuestionCircle } from "react-icons/fa";
import { useStores } from "../context/StoresContext";
import { sortPrefecturesByCode } from "../utils/prefectures";

// --- ヘルプツールチップ ---
function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const containerStyle = { display: "inline-block", position: "relative", marginLeft: 6, cursor: "pointer" };
  const popupStyle = {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginTop: 6,
    padding: 8,
    width: 280,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: 13,
    color: "#333",
    zIndex: 10,
    whiteSpace: "normal",
  };
  return (
    <span style={containerStyle}>
      <FaQuestionCircle
        color="#2e7d32"
        size={14}
        onClick={() => setVisible(!visible)}
        title="クリックで説明を表示／非表示"
        aria-label="ヘルプ説明トグル"
      />
      {visible && <div style={popupStyle}>{text}</div>}
    </span>
  );
}

// --- ホーム画面 ---
export default function Home() {
  const { stores } = useStores();
  const navigate = useNavigate();

  // --- 都道府県別集計 ---
  const validStores = stores.filter(s => s.prefecture && s.prefecture !== "不明");
  const prefMap = {};
  validStores.forEach(store => {
    const pref = store.prefecture;
    if (!prefMap[pref]) prefMap[pref] = { visited: 0, total: 0 };
    prefMap[pref].total++;
    if (store.visited) prefMap[pref].visited++;
  });

  let prefArray = Object.entries(prefMap).map(([prefecture, counts]) => ({ prefecture, ...counts }));
  const sortedPrefArray = sortPrefecturesByCode(prefArray.map(item => item.prefecture))
    .map(prefName => prefArray.find(item => item.prefecture === prefName))
    .filter(Boolean);

  // --- 閉店以外の店舗集計 ---
  const openStores = stores.filter(s => !s.closed);
  const openCount = openStores.length;
  const visitedOpenCount = openStores.filter(s => s.visited).length;
  const visitedOpenRate = openCount ? ((visitedOpenCount / openCount) * 100).toFixed(1) : 0;

  // --- スタイル ---
  const containerStyle = { padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" };
  const topBarStyle = { display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 };
  const iconButtonStyle = {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1.4em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const progressStyle = { width: "100%", height: 24, accentColor: "#4caf50", borderRadius: 8, overflow: "hidden" };
  const searchButtonContainerStyle = { display: "flex", alignItems: "center", justifyContent: "center", margin: "20px auto", maxWidth: 400, gap: 8 };
  const searchButtonStyle = { fontSize: "1.4em", padding: "14px 0", flex: 1, backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
  const listItemStyle = { cursor: "pointer", marginBottom: 12, padding: "10px 12px", borderBottom: "1.5px solid #ccc", display: "flex", flexDirection: "column", fontSize: "1.1em" };
  const listItemHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 };
  const progressBarContainerStyle = { display: "flex", alignItems: "center", gap: 10 };
  const headerWithHelpStyle = { display: "flex", alignItems: "center", gap: 6, marginTop: 40, marginBottom: 14, fontSize: "1.3em" };

  return (
    <div style={containerStyle}>
      {/* 設定ボタン */}
      <div style={topBarStyle}>
        <button onClick={() => navigate("/settings")} style={iconButtonStyle} title="設定">
          <FaCog />
        </button>
      </div>

      {/* 訪問状況 */}
      <h2 style={{ marginBottom: 6 }}>店舗訪問状況</h2>
      <div style={{ fontSize: "1.2em", marginBottom: 8 }}>
        {visitedOpenCount} / {openCount} 店舗（閉店除く）
      </div>
      <div style={progressBarContainerStyle}>
        <progress value={visitedOpenCount} max={openCount} style={progressStyle} />
        <span style={{ fontWeight: "bold", minWidth: 48 }}>{visitedOpenRate}%</span>
      </div>

      {/* 店舗検索ボタン */}
      <div style={searchButtonContainerStyle}>
        <button onClick={() => navigate("/search")} style={searchButtonStyle}>店舗検索</button>
        <HelpTooltip text="都道府県別や市区町村別、訪問済み、お気に入り等で店舗を絞り込み、訪問状況を確認できます。" />
      </div>

      {/* 都道府県別訪問状況 */}
      <div style={headerWithHelpStyle}>
        <span>都道府県別訪問状況</span>
        <HelpTooltip text="各都道府県の訪問数と訪問率を一覧表示しています。ここから都道府県別の店舗検索もできます。" />
      </div>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {sortedPrefArray.map(({ prefecture, visited, total }) => {
          const rate = total ? ((visited / total) * 100).toFixed(1) : 0;
          return (
            <li
              key={prefecture}
              style={listItemStyle}
              onClick={() => navigate(`/search?prefecture=${encodeURIComponent(prefecture)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/search?prefecture=${encodeURIComponent(prefecture)}`); }}
            >
              <div style={listItemHeaderStyle}>
                <span>{prefecture}</span>
                <span>{visited} / {total} 店舗 ({rate}%)</span>
              </div>
              <progress value={visited} max={total} style={{ ...progressStyle, height: 18, borderRadius: 6 }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
