// JSONエクスポート
export function exportToJSON(data, filename = "export") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// CSVエクスポート（簡易）
export function exportToCSV(data, filename = "export") {
  if (!Array.isArray(data) || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const csvRows = [
    keys.join(","), // ヘッダー
    ...data.map((row) => keys.map((k) => JSON.stringify(row[k] ?? "")).join(",")),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// JSONインポート（ファイル読み込み→ステート上書き）
export function importFromFile(setData, mode = "import") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedData = JSON.parse(reader.result);
        if (!Array.isArray(importedData)) {
          alert("インポートデータの形式が不正です。");
          return;
        }

        setData(importedData);
        localStorage.setItem("stores", JSON.stringify(importedData));

        if (mode === "import") {
          alert("インポートが完了しました。");
        } else {
          alert("復元が完了しました。");
        }
      } catch (err) {
        alert("読み込みに失敗しました: " + err.message);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}
