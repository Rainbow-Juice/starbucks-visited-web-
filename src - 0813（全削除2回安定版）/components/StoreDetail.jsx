import React, { useState, useEffect } from "react";
import { updateStore, deleteStore } from "../firebase";
import { FaArrowLeft, FaCog, FaQuestionCircle } from "react-icons/fa";

function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);

  const containerStyle = {
    display: "inline-block",
    position: "relative",
    marginLeft: 6,
    cursor: "pointer",
  };

  const popupStyle = {
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
    whiteSpace: "normal",
  };

  return (
    <span style={containerStyle}>
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
      {visible && <div style={popupStyle}>{text}</div>}
    </span>
  );
}

function StoreDetail({ store, onBack, onSettingsOpen, stores, setStores, refreshStores }) {
  const [form, setForm] = useState({ ...store });

  useEffect(() => {
    setForm({ ...store });
  }, [store]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateStore(form);
      alert("保存しました");
      await refreshStores();
      onBack();
    } catch (err) {
      alert("保存に失敗しました: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("本当に削除しますか？")) {
      try {
        await deleteStore(store.id);
        alert("削除しました");
        await refreshStores();
        onBack();
      } catch (err) {
        alert("削除に失敗しました: " + err.message);
      }
    }
  };

  const openMap = () => {
    const query = encodeURIComponent(
      [form.name, form.prefecture, form.city, form.streetAddress, form.building]
        .filter(Boolean)
        .join(" ")
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const containerStyle = {
    padding: 20,
    maxWidth: 600,
    margin: "0 auto",
    fontFamily: "sans-serif",
  };

  const topBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  };

  const buttonStyle = {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1.2em",
    display: "flex",
    alignItems: "center",
  };

  const iconButtonStyle = {
    ...buttonStyle,
    fontSize: "1.4em",
    padding: "10px 14px",
    justifyContent: "center",
  };

  const iconStyle = { marginRight: 10 };

  const deleteButtonStyle = {
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1.1em",
  };

  const saveButtonStyle = {
    ...buttonStyle,
    marginTop: 20,
    width: "100%",
  };

  const mapButtonStyle = {
    marginLeft: 12,
    padding: "8px 14px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1em",
  };

  const noteStyle = {
    marginTop: 4,
    fontSize: "0.85em",
    color: "#c62828",
  };

  const visitedRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
    fontSize: "1.1em",
  };

  const visitInputsStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const checkboxGroupStyle = {
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    maxWidth: 320,
    fontSize: "1.1em",
    userSelect: "none",
  };

  return (
    <div style={containerStyle}>
      <div style={topBarStyle}>
        <button onClick={onBack} style={buttonStyle} title="前の画面へ戻る">
          <FaArrowLeft style={iconStyle} />
          戻る
        </button>
        <button onClick={onSettingsOpen} style={iconButtonStyle} title="設定">
          <FaCog />
        </button>
      </div>

      {/* タイトルを店舗名のみに変更 */}
      <h2 style={{ fontWeight: "bold", fontSize: "1.8em", marginBottom: 16 }}>
        {form.name || "（店舗名なし）"}
      </h2>

      {/* 郵便番号、住所、建物を3行で表示 */}
      <div style={{ marginBottom: 14, fontSize: "1.1em" }}>
        {form.zipcode && (
          <div>
            <strong>住所:〒</strong> {form.zipcode}
          </div>
        )}
        <div>
          <div style={{ marginLeft: 8 }}>
            {[form.prefecture, form.city, form.streetAddress].filter(Boolean).join(" ")}
          </div>
        </div>
        {form.building && (
          <div style={{ marginLeft: 8, marginTop: 4 }}>
            {form.building}
          </div>
        )}
        <button
          onClick={openMap}
          style={{ ...mapButtonStyle, marginTop: 8 }}
          title="Googleマップで開く"
          aria-label="Googleマップで開く"
          type="button"
        >
          🗺️ Map
        </button>
        <HelpTooltip text="GoogleMapで店舗を表示します" />
      </div>

      <div style={visitedRowStyle}>
        <label style={{ cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={Boolean(form.visited)}
            onChange={(e) => {
              const checked = e.target.checked;
              handleChange("visited", checked);
              if (checked && (!form.visitCount || form.visitCount === 0)) {
                handleChange("visitCount", 1);
              }
              if (checked && !form.visitDate) {
                setTimeout(() => {
                  document.getElementById("visitDatePicker")?.showPicker?.();
                }, 100);
              }
              if (!checked) {
                handleChange("visitDate", null);
                handleChange("visitCount", 0);
              }
            }}
          />{" "}
          ✅訪問済み
        </label>

        <div style={visitInputsStyle}>
          <input
            id="visitDatePicker"
            type="date"
            value={form.visitDate || ""}
            onChange={(e) =>
              handleChange("visitDate", e.target.value === "" ? null : e.target.value)
            }
            style={{ padding: 6, fontSize: "1em" }}
            disabled={!form.visited}
          />
          <input
            type="number"
            min={0}
            value={form.visitCount || 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val < 0) return;
              handleChange("visitCount", val);
            }}
            style={{ width: 60, padding: 6, fontSize: "1em" }}
            disabled={!form.visited}
            aria-label="訪問回数"
          />{" "}
          回
        </div>
      </div>

      <div style={noteStyle}>※訪問済みのチェックを外すと回数が0に戻ります</div>

      <div style={checkboxGroupStyle}>
        {/* お気に入り */}
        <label style={{ cursor: "pointer", flexGrow: 1, fontSize: "1.1em" }}>
          <input
            type="checkbox"
            checked={Boolean(form.favorite)}
            onChange={(e) => handleChange("favorite", e.target.checked)}
          />{" "}
          ⭐お気に入り
        </label>

        {/* 閉店チェックボックス */}
        <input
          id="closedCheckbox"
          type="checkbox"
          checked={Boolean(form.closed)}
          onChange={(e) => handleChange("closed", e.target.checked)}
        />
        {/* 閉店ラベル（クリックでチェックは変わらない） */}
        <label
          htmlFor="closedCheckbox"
          style={{ cursor: "default", marginRight: 6, fontSize: "1.1em", userSelect: "none" }}
          onClick={(e) => e.preventDefault()}
        >
          ❌閉店
        </label>
        {/* 閉店ヘルプアイコン（クリックでチェックは変わらず、説明だけ表示） */}
        <HelpTooltip text="閉店にチェックを入れると、削除ボタンが表示されます。その後削除をタップすると店舗は削除されます。" />
      </div>

      {form.closed && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={handleDelete}
            style={deleteButtonStyle}
            title="この店舗を削除します（閉店している場合のみ）"
            type="button"
          >
            削除
          </button>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="memo" style={{ fontSize: "1.1em" }}>
          メモ:
        </label>
        <textarea
          id="memo"
          value={form.memo || ""}
          onChange={(e) => handleChange("memo", e.target.value)}
          rows={4}
          maxLength={500}
          style={{
            width: "100%",
            fontSize: "1em",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <small>最大500文字</small>
      </div>

      <button onClick={handleSave} style={saveButtonStyle} type="button">
        保存
      </button>
    </div>
  );
}

export default StoreDetail;
