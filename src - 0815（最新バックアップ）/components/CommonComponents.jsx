import React, { useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";

// --- ヘルプツールチップ ---
export function HelpTooltip({ text, size = 14 }) {
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
        size={size}
        onClick={() => setVisible(!visible)}
        title="クリックで説明を表示／非表示"
        aria-label="ヘルプ説明トグル"
      />
      {visible && <div style={popupStyle}>{text}</div>}
    </span>
  );
}

// --- 汎用ボタン ---
export function Button({ children, onClick, style = {}, type = "button" }) {
  const defaultStyle = {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "1.1em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <button type={type} onClick={onClick} style={{ ...defaultStyle, ...style }}>
      {children}
    </button>
  );
}
