// listStores.js
const admin = require("firebase-admin");
const path = require("path");

// サービスアカウントキーのパス
const serviceAccount = require(path.join(__dirname, "serviceAccountKey_0810.json"));

// Firebase Admin SDK 初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore インスタンス取得
const db = admin.firestore();

// 実行処理
async function listStores() {
  try {
    const snapshot = await db.collection("stores").get();
    console.log(`Firestore の店舗件数: ${snapshot.size} 件\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  name: ${data.name}`);
      console.log(`  prefecture: ${data.prefecture}`);
      console.log(`  visited: ${data.visited}`);
      console.log("----------------------");
    });

    console.log("\n=== 完了 ===");
    process.exit(0);
  } catch (error) {
    console.error("データ取得エラー:", error);
    process.exit(1);
  }
}

listStores();
