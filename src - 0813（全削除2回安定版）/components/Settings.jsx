import React, { useState } from "react";
import {
  exportToJSON,
  exportToCSV,
  importFromFile,
  restoreBackup,
  resetData,
  backupData,
  getBackupTimestamp,
} from "../utils/dataIO";
import { fetchStores, overwriteStoresFromJSON } from "../firebase";
import { FaQuestionCircle, FaPlus } from "react-icons/fa";
import StoreAdd from "./StoreAdd";

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

function Settings({ onBack, stores, setStores, refreshStores }) {
  const timestamp = getBackupTimestamp();
  const [helpOpen, setHelpOpen] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [loading, setLoading] = useState(false);  // 操作の二重防止用
  const [processing, setProcessing] = useState(false);  // スピナー表示用

  // Firestoreの店舗データ件数とIDをログ出力（検証用）
  async function logFirestoreStores() {
    try {
      const firestoreStores = await fetchStores();
      console.log("【Firestore 店舗件数】", firestoreStores.length);
      const ids = firestoreStores.map((s) => s.id);
      console.log("【Firestore 店舗ID一覧】", ids);
    } catch (e) {
      console.error("Firestoreデータ取得エラー:", e);
    }
  }

  // 追加画面閉じる
  const handleCloseAddStore = () => {
    setShowAddStore(false);
  };

  // 初期化（リセット）処理
  const handleResetData = async () => {
    if (loading) return;
    if (
      !window.confirm(
        "すべてのデータを初期状態に戻します。よろしいですか？ この操作は元に戻せません。"
      )
    ) {
      return;
    }
    setLoading(true);
    setProcessing(true);
    try {
      const beforeStores = await fetchStores();
      console.log("【初期化前 Firestore 店舗件数】", beforeStores.length);
      console.log("【初期化前 Firestore 店舗ID一覧】", beforeStores.map((s) => s.id));

      await resetData(setStores);

      const afterStores = await fetchStores();
      console.log("【初期化後 Firestore 店舗件数】", afterStores.length);
      console.log("【初期化後 Firestore 店舗ID一覧】", afterStores.map((s) => s.id));

      if (typeof refreshStores === "function") {
        await refreshStores();
      }
      alert("すべてのデータを初期状態に戻しました。");
    } catch (e) {
      alert("リセット処理でエラーが発生しました: " + e.message);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // バックアップ保存
  const handleBackupData = () => {
    if (loading) return;
    backupData(stores);
  };

  // バックアップ復元
  const handleRestoreBackup = async () => {
    if (loading) return;
    setLoading(true);
    setProcessing(true);
    try {
      const data = await restoreBackup();
      if (!data) {
        setProcessing(false);
        setLoading(false);
        return;
      }
      await overwriteStoresFromJSON(data);
      setStores(data);
      if (typeof refreshStores === "function") {
        await refreshStores();
      }
      alert("バックアップから復元し、反映しました");
    } catch (e) {
      console.error(e);
      alert("バックアップ復元でエラーが発生しました: " + e.message);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // JSONエクスポート
  const handleExportJSON = () => {
    if (loading) return;
    exportToJSON(stores);
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    if (loading) return;
    exportToCSV(stores);
  };

  // インポート処理
  const handleImportFromFile = async () => {
    if (loading) return;
    setLoading(true);
    setProcessing(true);
    try {
      const parsed = await importFromFile();
      if (parsed === null) {
        setProcessing(false);
        setLoading(false);
        return;
      }
      await overwriteStoresFromJSON(parsed);
      setStores(parsed);
      if (typeof refreshStores === "function") {
        await refreshStores();
      }
      alert("処理が完了し、上書きされました");
    } catch (e) {
      console.error(e);
      alert("インポート処理でエラーが発生しました: " + e.message);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  // スタイル定義
  const containerStyle = {
    padding: 20,
    maxWidth: 500,
    margin: "0 auto",
  };

  const sectionStyle = {
    marginBottom: 24,
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    position: "relative",
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "1em",
    cursor: "pointer",
    opacity: loading ? 0.6 : 1,
  };

  const grayButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#757575",
  };

  const infoStyle = {
    fontSize: "0.9em",
    color: "#333",
    marginTop: 8,
    wordBreak: "break-word",
  };

  return (
    <div style={containerStyle}>
      {/* 店舗の追加セクション */}
      <div style={sectionStyle}>
        <h3>
          店舗の追加
          <HelpTooltip text="新規店舗の追加ができます" />
        </h3>
        <button
          style={buttonStyle}
          onClick={() => setShowAddStore(true)}
          aria-label="新規店舗の追加"
          disabled={loading}
        >
          <FaPlus />
          店舗の追加
        </button>
      </div>

      {/* 追加画面モーダル */}
      {showAddStore && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              maxWidth: 480,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <StoreAdd onClose={handleCloseAddStore} />
          </div>
        </div>
      )}

      {/* 処理中モーダル */}
      {processing && (
        <div
          role="alertdialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 24,
              borderRadius: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              fontSize: 18,
              fontWeight: "bold",
              color: "#2e7d32",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              width: 320,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: "3px solid #ddd",
                borderTopColor: "#2e7d32",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <div>処理中です。少々お待ちください…</div>
          </div>
        </div>
      )}

      {/* データのエクスポート */}
      <div style={sectionStyle}>
        <h3>
          データのエクスポート
          <HelpTooltip
            text={
              <>
                現在の店舗データをファイルに保存します。
                <br />
                JSONは完全なデータ形式、CSVは表形式で編集に便利です。
                <br />
                保存先はブラウザの設定によって異なります。
              </>
            }
          />
        </h3>
        <button style={buttonStyle} onClick={handleExportJSON} disabled={loading}>
          📁 JSON形式で保存
        </button>
        <button style={buttonStyle} onClick={handleExportCSV} disabled={loading}>
          📄 CSV形式で保存
        </button>
        <div style={infoStyle}>現在の全データをバックアップとして保存できます。</div>
      </div>

      {/* データのインポート */}
      <div style={sectionStyle}>
        <h3>
          データのインポート
          <HelpTooltip
            text={
              <>
                外部で編集したファイルからデータを読み込みます。
                <br />
                読み込むと今のデータは上書きされますので注意してください。
                <br />
                ファイルの形式と内容が正しいことを確認してください。
              </>
            }
          />
        </h3>
        <button style={buttonStyle} onClick={handleImportFromFile} disabled={loading}>
          📤 ファイルから読み込む
        </button>
        <div style={infoStyle}>
          JSONまたはCSVファイルからデータを復元します。現在のデータは上書きされます。
        </div>
      </div>

      {/* バックアップと復元 */}
      <div style={sectionStyle}>
        <h3>
          バックアップと復元
          <HelpTooltip
            text={
              <>
                ブラウザのローカルにデータを保存・取り出しできます。
                <br />
                エクスポートより簡単ですが、ブラウザの設定で消える場合があります。
                <br />
                操作は手動で行います。
              </>
            }
          />
        </h3>
        <button style={buttonStyle} onClick={handleBackupData} disabled={loading}>
          💾 バックアップを保存
        </button>
        <button style={buttonStyle} onClick={handleRestoreBackup} disabled={loading}>
          ♻️ 最後のバックアップから復元
        </button>
        <div style={infoStyle}>
          最終保存: {timestamp ? timestamp.replace("T", " ").slice(0, 16) : "なし"}
        </div>
      </div>

      {/* データの初期化 */}
      <div style={sectionStyle}>
        <h3>
          データの初期化
          <HelpTooltip
            text={
              <>
                すべてのデータを最初の状態に戻します。
                <br />
                実行すると元に戻せません。
                <br />
                必ず事前にバックアップをとってください。
                <br />
                リセットには時間がかかる場合があります。処理中は画面を閉じたり操作を続けないでください。
              </>
            }
          />
        </h3>
        <button
          style={{ ...buttonStyle, backgroundColor: "#c62828" }}
          onClick={handleResetData}
          disabled={loading}
        >
          🗑️ すべて初期状態に戻す
        </button>
        <div style={infoStyle}>
          すべてのデータを初期状態（初期店舗リスト）に戻します。この操作は元に戻せません。
        </div>
      </div>

      {/* ヘルプ開閉ボタン（グレー） */}
      <button
        style={grayButtonStyle}
        onClick={() => setHelpOpen(!helpOpen)}
        aria-expanded={helpOpen}
        aria-controls="detailed-help"
        disabled={loading}
      >
        {helpOpen ? "▼ ヘルプを閉じる" : "▶ ヘルプを開く"}
      </button>

      {helpOpen && (
        <div
          id="detailed-help"
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: "#333",
            marginTop: 12,
            marginBottom: 24,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 12,
            backgroundColor: "#f9f9f9",
            whiteSpace: "normal",
          }}
        >
          <p>
            <strong>📁 エクスポート</strong>
            <br />
            現在の店舗データをJSONまたはCSV形式でファイル保存します。
            JSONは完全なデータを保存し、他の環境でも復元可能です。
            CSVは表形式で閲覧やExcelでの編集に便利ですが、データ構造の詳細は失われる場合があります。
            保存先はブラウザのダウンロードフォルダや設定によります。
          </p>
          <p>
            <strong>📤 インポート</strong>
            <br />
            外部で編集したJSONまたはCSVファイルからデータを読み込みます。
            読み込むと現在のデータは上書きされるため、重要なデータは事前にエクスポートしておいてください。
            インポート時はファイルの形式とデータの正確さに注意してください。
            不正なファイルの場合は読み込みに失敗します。
          </p>
          <p>
            <strong>💾 バックアップ・復元</strong>
            <br />
            ブラウザのローカルストレージにデータのバックアップを保存・復元します。
            通常のエクスポートよりも手軽に作業途中の状態を保存可能ですが、
            ローカルストレージはブラウザの設定で消去されることがあります。
            バックアップは自動ではなく、手動操作が必要です。
          </p>
          <p>
            <strong>🗑️ 初期化（リセット）</strong>
            <br />
            すべてのデータを初期状態（インストール時の店舗データ）に戻します。
            操作は取り消せません。実行前に必ずバックアップを作成してください。
            初期データに戻した後は、必要に応じて再度データを追加・編集してください。
          </p>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button onClick={onBack} style={buttonStyle} disabled={loading}>
          ← ホームに戻る
        </button>
      </div>

      {/* スピナー用のCSSアニメーション定義 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default Settings;
