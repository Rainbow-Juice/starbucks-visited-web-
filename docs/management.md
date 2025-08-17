Starbucks Visited Web 管理手順書



1\. バックアップ

重要: starbucks-visited-web フォルダを整理する前に必ず全体をバックアップしてください。

例: D:\\ドキュメント\\starbucks-visited-web - バックアップ0811



2\. フォルダ整理（cleanup.ps1 使用）



実行手順

cleanup.ps1 を starbucks-visited-web 直下に保存

PowerShell を管理者権限で開き、実行ポリシーを確認

　Get-ExecutionPolicy

starbucks-visited-webに移動して

　cd "D:\\ドキュメント\\starbucks-visited-web"

スクリプト実行

　.\\cleanup.ps1



【PowerShellの例】

PS C:\\WINDOWS\\system32> Get-ExecutionPolicy

>>

RemoteSigned

PS C:\\WINDOWS\\system32> cd "D:\\ドキュメント\\starbucks-visited-web"

>>

PS D:\\ドキュメント\\starbucks-visited-web> .\\cleanup.ps1


実行結果を確認し、残すファイルが正しいことを確認



3\. Git での管理手順

削除後に変更をステージング

　git add -u

コミット

　git commit -m "説明を記載する"

GitHub にプッシュ

　git push origin main

GitHub Actions が正しく動作することを確認


★ Git コミットメッセージ例集 ★

1\. フォルダ整理・不要ファイル削除

Remove unnecessary files and folders after cleanup

Delete backup and temporary folders

Clean up src/assets and src/public unused files

Remove node\_modules and dist directories



2\. ファイル復元・必須ファイル追加

Restore firebase.json for Firebase Hosting

Add src/index.css for main styling

Recover .github/workflows files for GitHub Actions

Restore essential data files from backup



3\. 修正・更新

Fix missing import in src/main.jsx

Update cleanup.ps1 script to preserve required files

Correct typos in management.md

Update README.md with new instructions



4\. 新規追加機能・スクリプト

Add cleanup.ps1 for minimal folder maintenance

Add docs/management.md for project guidelines

Add Firebase deployment workflow files



5\. 一時的対応・テスト

Temporary fix for build error on GitHub Actions

Test Firebase deployment workflow

Check index.css import issue

