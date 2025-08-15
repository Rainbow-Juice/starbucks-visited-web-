import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaPlus } from "react-icons/fa";
import StoreAdd from "./StoreAdd";
import {
  exportToJSON,
  exportToCSV,
  importFromFile,
  restoreBackup,
  resetData,
  backupData,
  getBackupTimestamp,
} from "../utils/dataIO";
import { useStores } from "../context/StoresContext";

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

// --- 所要時間フォーマット ---
function formatDuration(ms) {
  if (!ms && ms !== 0) return "-";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}分${remainSec}秒`;
}

export default function Settings() {
  const navigate = useNavigate();
  const { stores, setStores, addOperationReport, batchSize, updateBatchSize } = useStores();
  const timestamp = getBackupTimestamp();

  const [helpOpen, setHelpOpen] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastMetrics, setLastMetrics] = useState([]);

  // --- LocalStorage から直近レポート読み込み ---
  useEffect(() => {
    const savedMetrics = localStorage.getItem("lastMetrics");
    if (savedMetrics) {
      try {
        setLastMetrics(JSON.parse(savedMetrics));
      } catch {}
    }
  }, []);

  // --- 保存＆Context連動 ---
  const saveMetrics = (metrics) => {
    addOperationReport(metrics.label, metrics);
    const updated = [metrics, ...lastMetrics].slice(0, 20);
    setLastMetrics(updated);
    localStorage.setItem("lastMetrics", JSON.stringify(updated));
  };

  // --- 店舗追加モーダル ---
  const handleCloseAddStore = () => setShowAddStore(false);

  // --- データ初期化 ---
  const handleResetData = async () => {
    if (loading) return;
    if (!window.confirm("すべてのデータを初期状態に戻します。よろしいですか？ この操作は元に戻せません。")) return;
    setLoading(true);
    setProcessing(true);
    try {
      const metrics = await resetData(setStores);
      saveMetrics({ label: "初期化", ...metrics });
      alert(
        [
          "データの初期化が完了しました。",
          `処理前件数: ${metrics.countBefore}`,
          `削除後件数: ${metrics.afterDelete}`,
          `書き込み件数: ${metrics.written}`,
          `書き込み後件数: ${metrics.countAfterWrite}`,
          `所要時間: ${formatDuration(metrics.durationMs)}`,
        ].join("\n")
      );
    } catch (e) {
      alert("リセット処理でエラーが発生しました: " + (e?.message || String(e)));
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // --- バックアップ ---
  const handleBackupData = () => {
    if (!loading) backupData(stores);
  };

  const handleRestoreBackup = async () => {
    if (loading) return;
    setLoading(true);
    setProcessing(true);
    try {
      const { data, metrics } = await restoreBackup();
      if (!data) return;
      setStores(data);
      saveMetrics({ label: "復元", ...metrics });
      alert(
        [
          "バックアップ復元が完了しました。",
          `処理前件数: ${metrics.countBefore}`,
          `削除後件数: ${metrics.afterDelete}`,
          `書き込み件数: ${metrics.written}`,
          `書き込み後件数: ${metrics.countAfterWrite}`,
          `所要時間: ${formatDuration(metrics.durationMs)}`,
        ].join("\n")
      );
    } catch (e) {
      console.error(e);
      alert("バックアップ復元でエラーが発生しました: " + (e?.message || String(e)));
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // --- データインポート ---
  const handleImportFromFile = async () => {
    if (loading) return;
    setLoading(true);
    setProcessing(true);
    try {
      const result = await importFromFile();
      if (!result) return;
      const { data, metrics } = result;
      setStores(data);
      saveMetrics({ label: "インポート", ...metrics });
      alert(
        [
          "インポート処理が完了しました。",
          `処理前件数: ${metrics.countBefore}`,
          `削除後件数: ${metrics.afterDelete}`,
          `書き込み件数: ${metrics.written}`,
          `書き込み後件数: ${metrics.countAfterWrite}`,
          `所要時間: ${formatDuration(metrics.durationMs)}`,
        ].join("\n")
      );
    } catch (e) {
      console.error(e);
      alert("インポート処理でエラーが発生しました: " + (e?.message || String(e)));
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // --- スタイル ---
  const containerStyle = { padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" };
  const sectionStyle = { marginBottom: 24, padding: 10, border: "1px solid #ccc", borderRadius: 8 };
  const buttonStyle = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "12px", margin: "8px 0", backgroundColor: "#2e7d32",
    color: "#fff", border: "none", borderRadius: 6, fontSize: "1em", cursor: "pointer",
    opacity: loading ? 0.6 : 1,
  };
  const grayButtonStyle = { ...buttonStyle, backgroundColor: "#757575" };
  const tableContainerStyle = { overflowX: "auto", marginTop: 16 };
  const tableStyle = { width: "100%", borderCollapse: "collapse", minWidth: 600 };
  const thStyle = { border: "1px solid #ccc", padding: 8, backgroundColor: "#f2f2f2", textAlign: "center" };
  const tdStyle = { border: "1px solid #ccc", padding: 8, textAlign: "center" };

  return (
    <div style={containerStyle}>
      {/* 店舗追加 */}
      <div style={sectionStyle}>
        <h3>店舗の追加<HelpTooltip text="新規店舗の追加ができます" /></h3>
        <button style={buttonStyle} onClick={() => setShowAddStore(true)} aria-label="新規店舗の追加" disabled={loading}>
          <FaPlus />店舗の追加
        </button>
      </div>

      {showAddStore && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", padding: 20, borderRadius: 8,
            maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto"
          }}>
            <StoreAdd onClose={handleCloseAddStore} />
          </div>
        </div>
      )}

      {processing && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 10000
        }}>
          <div style={{
            backgroundColor: "#fff", padding: 24, borderRadius: 8,
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)", fontSize: 18,
            fontWeight: "bold", color: "#2e7d32", display: "flex",
            flexDirection: "column", alignItems: "center", gap: 12, width: 320
          }}>
            <div style={{
              width: 20, height: 20, border: "3px solid #ddd",
              borderTopColor: "#2e7d32", borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <div>処理中です。少々お待ちください…</div>
          </div>
        </div>
      )}

      {/* --- ここから追加: Firebase バッチ件数 --- */}
      <div style={sectionStyle}>
        <h3>Firebase バッチ件数設定<HelpTooltip text="バッチ書き込み時の件数を選択します（大きすぎると無料枠制限に影響する場合があります）" /></h3>
        <div style={{ display: "flex", gap: 12 }}>
          {[100, 200, 500].map((size) => (
            <label key={size} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                value={size}
                checked={batchSize === size}
                onChange={() => updateBatchSize(size)}
                disabled={loading}
              />
              {size} 件
            </label>
          ))}
        </div>
      </div>
      {/* --- 追加ここまで --- */}

      {/* エクスポート */}
      <div style={sectionStyle}>
        <h3>データのエクスポート<HelpTooltip text="JSONまたはCSVで保存できます" /></h3>
        <button style={buttonStyle} onClick={() => exportToJSON(stores)} disabled={loading}>📁 JSON形式で保存</button>
        <button style={buttonStyle} onClick={() => exportToCSV(stores)} disabled={loading}>📄 CSV形式で保存</button>
      </div>

      {/* インポート */}
      <div style={sectionStyle}>
        <h3>データのインポート<HelpTooltip text="外部ファイルから読み込みます" /></h3>
        <button style={buttonStyle} onClick={handleImportFromFile} disabled={loading}>📤 ファイルから読み込む</button>
      </div>

      {/* バックアップ */}
      <div style={sectionStyle}>
        <h3>バックアップと復元<HelpTooltip text="ブラウザのローカルに保存／復元します" /></h3>
        <button style={buttonStyle} onClick={handleBackupData} disabled={loading}>💾 バックアップを保存</button>
        <button style={buttonStyle} onClick={handleRestoreBackup} disabled={loading}>♻️ 最後のバックアップから復元</button>
        <div>最終保存: {timestamp ? timestamp.replace("T", " ").slice(0, 16) : "なし"}</div>
      </div>

      {/* 初期化 */}
      <div style={sectionStyle}>
        <h3>データの初期化<HelpTooltip text="全データを初期状態に戻します" /></h3>
        <button style={{ ...buttonStyle, backgroundColor: "#c62828" }} onClick={handleResetData} disabled={loading}>🗑️ すべて初期状態に戻す</button>
      </div>

      {/* ヘルプ */}
      <button style={grayButtonStyle} onClick={() => setHelpOpen(!helpOpen)} aria-expanded={helpOpen} disabled={loading}>
        {helpOpen ? "▼ ヘルプを閉じる" : "▶ ヘルプを開く"}
      </button>

      {helpOpen && (
        <div style={{
          marginTop: 16, padding: 12, border: "1px solid #ccc",
          borderRadius: 6, backgroundColor: "#f9f9f9", lineHeight: 1.5, fontSize: 14
        }}>
          <p>・店舗追加、データインポート／エクスポート、バックアップ／復元、初期化などが行えます。</p>
          <p>・操作を実行する前に確認画面が出るので、誤操作を防げます。</p>
          <p>・直近20件の操作レポート（件数や所要時間など）もここで確認可能です。</p>

          {lastMetrics.length > 0 && (
            <div style={tableContainerStyle}>
              <h4>直近の操作レポート</h4>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>操作内容</th>
                    <th style={thStyle}>処理前件数</th>
                    <th style={thStyle}>削除後件数</th>
                    <th style={thStyle}>書き込み件数</th>
                    <th style={thStyle}>書き込み後件数</th>
                    <th style={thStyle}>所要時間</th>
                    <th style={thStyle}>実行日時</th>
                  </tr>
                </thead>
                <tbody>
                  {lastMetrics.map((m, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}>{m.label || "-"}</td>
                      <td style={tdStyle}>{m.countBefore ?? "-"}</td>
                      <td style={tdStyle}>{m.afterDelete ?? "-"}</td>
                      <td style={tdStyle}>{m.written ?? "-"}</td>
                      <td style={tdStyle}>{m.countAfterWrite ?? "-"}</td>
                      <td style={tdStyle}>{formatDuration(m.durationMs)}</td>
                      <td style={tdStyle}>{m.timestamp || new Date().toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ホームへ戻る */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={() => {
            setShowAddStore(false);
            navigate("/");
          }}
          style={buttonStyle}
          disabled={loading}
        >
          ← ホームに戻る
        </button>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
