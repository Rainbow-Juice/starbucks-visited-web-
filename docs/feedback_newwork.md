# Starbucks Visited Web App
## 今後のフィードバック・改善作業の手順

### 1. 目的
このドキュメントは、Starbucks Visited Web アプリの今後の使用感フィードバックや改善作業を効率よく進めるための手順をまとめています。

### 2. 現状の成果物
- **リポジトリ構成**: 不要ファイルは整理済み
  - 残す主要フォルダ・ファイル:
    - `.github` (GitHub Actions)
    - `firebase.json` (Firebase Hosting 設定)
    - `src/index.css` (アプリ基本スタイル)
    - `.firebaserc` (Firebase 設定)
- **Firebase Hosting**: 正常にデプロイ可能
- **GitHub Actions**: main ブランチへの push で自動ビルド＆デプロイ
- **PowerShell スクリプト**: `cleanup.ps1` により不要ファイル整理可能

### 3. 作業手順（フィードバック・改善時）
1. **ローカル環境で作業**
   - 作業前に必ず `git pull origin main` で最新を取得
   - `cleanup.ps1` を使用する場合は、必ずバックアップを作成
2. **必要な変更の実施**
   - コード修正・追加
   - デザインやファイル整理
   - Firebase 設定変更が必要な場合は `.firebaserc` や `firebase.json` を更新
3. **Git 操作**
   - ステージング: `git add .` または必要なファイルのみ
   - コミット: `git commit -m "変更内容を簡潔に記載"`
     - 例:
       - `Fix typo in Home.jsx`
       - `Update store list JSON`
       - `Cleanup unused assets`
   - プッシュ: `git push origin main`
4. **デプロイ確認**
   - GitHub Actions が自動でビルド・デプロイ
   - Firebase Hosting 上で正常に動作するか確認
5. **フィードバックの記録**
   - 使用感、バグ、改善点を別途メモ（Google Docs、Notion など）にまとめ
6. **次回作業への反映**
   - 修正・改善の履歴は Git に残す
   - 必要に応じて `docs/feedback_newWork.md` に作業メモを追記

### 4. フォルダ整理ルール
- **src/** 内は主要コードとスタイルのみ残す
- **ルート直下**は必要最低限の設定ファイルのみ残す
- **不要ファイル**はバックアップフォルダに保管
- 定期的に `cleanup.ps1` を実行して不要ファイル整理

### 5. 注意点
- `cleanup.ps1` を実行する前に必ずバックアップ
- Firebase 関連ファイルや `.github` は削除しない
- コミットメッセージは短くても内容が分かるものにする
- 作業履歴を `docs/feedback_newWork.md` に残すと、新しい作業者も理解しやすい

