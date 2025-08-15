import React, { useState } from "react";
import { addStore } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { prefectureOrder } from "../utils/prefectures";
import { useStores } from "../context/StoresContext";

// 時間フォーマット関数（秒 → "〇分〇秒"）
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

export default function StoreAdd({ onClose }) {
  const { refreshStores, addOperationLog } = useStores();

  const [name, setName] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [building, setBuilding] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleZipcodeBlur = async () => {
    const trimmedZip = zipcode.trim().replace("-", "");
    if (!trimmedZip || !/^\d{7}$/.test(trimmedZip)) {
      setError("郵便番号は7桁の数字で入力してください");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${trimmedZip}`);
      const data = await response.json();

      if (data.status === 200 && data.results?.length > 0) {
        const result = data.results[0];
        setPrefecture(result.address1?.trim() || "");
        setCity(result.address2?.trim() || "");
        setStreetAddress(result.address3?.trim() || "");
        setError("");
      } else {
        setError("該当する住所が見つかりませんでした。");
      }
    } catch (err) {
      console.error("郵便番号APIエラー:", err);
      setError("郵便番号の自動補完に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !prefecture.trim() || !city.trim()) {
      alert("「店舗名」「都道府県」「市区町村」は必須です。");
      return;
    }

    const newStore = {
      id: uuidv4(),
      name: name.trim(),
      zipcode: zipcode.trim(),
      prefecture: prefecture.trim(),
      city: city.trim(),
      streetAddress: streetAddress.trim(),
      building: building.trim(),
      visited: false,
      visitDate: null,
      visitCount: 0,
      favorite: false,
      closed: false,
      memo: "",
    };

    setLoading(true);
    try {
      const startTime = Date.now();
      await addStore(newStore);
      await refreshStores();

      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      addOperationLog({
        action: "店舗追加",
        store: newStore.name,
        duration: formatDuration(elapsedSec),
      });

      alert("店舗を追加しました。");
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert("登録に失敗しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "6px 8px", fontSize: "1em", marginBottom: 10, boxSizing: "border-box" };
  const buttonStyle = { padding: "8px 16px", fontSize: "1em", cursor: "pointer" };

  return (
    <div style={{ padding: 16, maxWidth: 480 }}>
      <h2>新規店舗追加</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>郵便番号：</label><br />
          <input
            type="text"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            onBlur={handleZipcodeBlur}
            placeholder="例: 1000001"
            maxLength={8}
            pattern="\d{3}-?\d{4}"
            inputMode="numeric"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        {loading && <p style={{ color: "blue" }}>住所を取得中...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div>
          <label>店舗名：</label><br />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} autoComplete="off" />
        </div>

        <div>
          <label>都道府県：</label><br />
          <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} required style={inputStyle}>
            <option value="">-- 選択してください --</option>
            {prefectureOrder.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        <div>
          <label>市区町村：</label><br />
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required style={inputStyle} autoComplete="off" />
        </div>

        <div>
          <label>番地・丁目など：</label><br />
          <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label>建物名など（任意）：</label><br />
          <input type="text" value={building} onChange={(e) => setBuilding(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" style={buttonStyle} disabled={loading}>追加</button>
          <button type="button" style={{ ...buttonStyle, marginLeft: 10 }} onClick={() => onClose && onClose()} disabled={loading}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
