// src/components/HelpModal.jsx
import React from "react";

const modalStyle = {
  position: "fixed",
  top: "10%",
  left: "10%",
  width: "80%",
  height: "80%",
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  borderRadius: "12px",
  padding: "20px",
  overflowY: "auto",
  zIndex: 1000,
};

const overlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.3)",
  zIndex: 999,
};

export default function HelpModal({ onClose }) {
  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <h2>アプリの使い方</h2>
        <ul>
          <li><strong>店舗を検索</strong>: 上部の検索アイコンから店舗名を入力して検索できます。</li>
          <li><strong>訪問済みの記録</strong>: 店舗詳細で訪問済みチェックを入れられます。</li>
          <li><strong>設定</strong>: バックアップ、インポート/エクスポート、リセットなどが行えます。</li>
          <li><strong>都道府県別一覧</strong>: 地域ごとに訪問店舗を一覧表示できます。</li>
          <li><strong>Firebase同期</strong>: データを複数端末で共有できます（設定で有効化）。</li>
        </ul>
        <button onClick={onClose} style={{ marginTop: 20 }}>閉じる</button>
      </div>
    </>
  );
}
