# ★starbucks-visited-web 最小化整理スクリプト★
# 実行前に必ずバックアップがあることを確認してください

$baseDir = "D:\ドキュメント\starbucks-visited-web"

# --- ルート直下の削除対象フォルダ ---
$foldersToRemove = @(
    "dist",
    "node_modules",
    "keys",
    "CSV to JSON",
    "OriginalData",
    "scripts"
    # ".github" は残すのでリストから除外
)

# --- ルート直下の削除対象ファイル ---
$filesToRemove = @(
    "folder_top.txt",
    "vite.svg"
    # ".firebaserc" や "firebase.json" は残す
)

# --- src 下削除対象フォルダ ---
$srcFoldersToRemove = @(
    "assets",
    "public"   # src/public 下の不要 index.html
)

# --- src 下削除対象ファイル ---
$srcFilesToRemove = @(
    "App.css"
    # "index.css" は残す
)

# --- ルート削除処理 ---
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

# --- src 下削除処理 ---
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
Write-Host "残ったもの: .github, firebase.json, src/index.css, .firebaserc など"
