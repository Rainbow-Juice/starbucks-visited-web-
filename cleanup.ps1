# ★starbucks-visited-web 最小化整理スクリプト★
# 実行前に必ずバックアップがあることを確認してください

$baseDir = "D:\ドキュメント\starbucks-visited-web"

# 削除対象フォルダ（ルート直下）
$foldersToRemove = @(
    "dist",
    "node_modules",
    "keys",
    "CSV to JSON",
    "OriginalData",
    "scripts",
    ".github"
)

# 削除対象ファイル（ルート直下）
$filesToRemove = @(
    "folder_top.txt",
    "vite.svg",    # ルートの不要な vite.svg
    ".firebaserc", # 必要に応じて残す場合はコメントアウト
    "firebase.json" # 必要に応じて残す場合はコメントアウト
)

# src 下削除対象フォルダ
$srcFoldersToRemove = @(
    "assets",      # react.svg 等
    "public"       # src/public 下の不要 index.html
)

# src 下削除対象ファイル
$srcFilesToRemove = @(
    "App.css",
    "index.css"
)

# --- ルート削除 ---
foreach ($folder in $foldersToRemove) {
    $fullPath = Join-Path $baseDir $folder
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Recurse -Force
        Write-Host "Deleted folder: $fullPath"
    }
}

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Deleted file: $fullPath"
    }
}

# --- src 下削除 ---
$srcDir = Join-Path $baseDir "src"

foreach ($folder in $srcFoldersToRemove) {
    $fullPath = Join-Path $srcDir $folder
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Recurse -Force
        Write-Host "Deleted src folder: $fullPath"
    }
}

foreach ($file in $srcFilesToRemove) {
    $fullPath = Join-Path $srcDir $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Deleted src file: $fullPath"
    }
}

Write-Host "整理完了。必要なファイル・フォルダは残っています。"
