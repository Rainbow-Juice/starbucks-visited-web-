// countStores.js

const admin = require("firebase-admin");
const path = require("path");

// サービスアカウントキーのパスを指定
const serviceAccountPath = path.join(__dirname, "serviceAccountKey_0810.json");

// Firebase Admin SDK 初期化
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

// 店舗数を数える関数
async function countStores() {
  try {
    const snapshot = await db.collection("stores").get();
    console.log(`Firestoreの店舗件数: ${snapshot.size} 件`);
  } catch (error) {
    console.error("店舗件数取得エラー:", error);
  }
}

countStores();
