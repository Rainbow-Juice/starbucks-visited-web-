import React, { useEffect, useState } from "react";
import { auth, provider, db } from "./firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);

  // ログイン状態を監視
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  // ユーザーがログインしていたら、store一覧を取得
  useEffect(() => {
    if (user) {
      loadStores();
    } else {
      setStores([]);
    }
  }, [user]);

  const loadStores = async () => {
    const q = query(collection(db, "stores"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const loaded = [];
    querySnapshot.forEach((doc) => {
      loaded.push({ id: doc.id, ...doc.data() });
    });
    setStores(loaded);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("ログインエラー:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("ログアウトエラー:", err);
    }
  };

  const toggleVisited = async (storeId, current) => {
    const storeRef = doc(db, "stores", storeId);
    await updateDoc(storeRef, { visited: !current });
    loadStores(); // 再読み込み
  };

  const toggleFavorite = async (storeId, current) => {
    const storeRef = doc(db, "stores", storeId);
    await updateDoc(storeRef, { favorite: !current });
    loadStores(); // 再読み込み
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Starbucks Visited Web</h1>
      {user ? (
        <div>
          <p>こんにちは、{user.displayName} さん</p>
          <img
            src={user.photoURL}
            alt="プロフィール画像"
            width="80"
            style={{ borderRadius: "50%" }}
          />
          <br />
          <button onClick={handleLogout}>ログアウト</button>

          <hr />

          <h2>店舗一覧（{stores.length}件）</h2>
          <ul>
            {stores.map((store) => (
              <li key={store.id} style={{ marginBottom: "1rem" }}>
                <strong>{store.name}</strong>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={store.visited}
                    onChange={() => toggleVisited(store.id, store.visited)}
                  />{" "}
                  訪問済み
                </label>{" "}
                <label style={{ marginLeft: "1rem" }}>
                  <input
                    type="checkbox"
                    checked={store.favorite}
                    onChange={() => toggleFavorite(store.id, store.favorite)}
                  />{" "}
                  お気に入り
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={handleLogin}>Googleでログイン</button>
      )}
    </div>
  );
}

export default App;
