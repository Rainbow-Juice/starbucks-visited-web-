import React, { useState, useEffect } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import Home from "./components/Home";
import StoreSearch from "./components/StoreSearch";
import StoreDetail from "./components/StoreDetail";
import StoreAdd from "./components/StoreAdd";
import Settings from "./components/Settings";
import { fetchStores } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("home");
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchPrefecture, setSearchPrefecture] = useState(null);
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem("stores");
    return saved ? JSON.parse(saved) : [];
  });

  // データをサーバ（Firebase）から取得してローカル state に反映する関数
  const refreshStores = async () => {
    try {
      const fetched = await fetchStores();
      setStores(fetched);
      localStorage.setItem("stores", JSON.stringify(fetched));
    } catch (err) {
      console.error("データの再取得に失敗しました:", err);
    }
  };

  // stores を localStorage に同期
  useEffect(() => {
    localStorage.setItem("stores", JSON.stringify(stores));
  }, [stores]);

  // 認証状態監視（ログイン時に stores を取得）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchStores()
          .then((fetchedStores) => {
            setStores(fetchedStores);
            localStorage.setItem("stores", JSON.stringify(fetchedStores));
          })
          .catch((error) => {
            console.error("店舗データ取得エラー:", error);
          });
      } else {
        setStores([]);
        localStorage.removeItem("stores");
      }
    });
    return () => unsubscribe();
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "search":
        return (
          <StoreSearch
            stores={stores}
            setStores={setStores}
            onBack={() => setCurrentScreen("home")}
            onStoreSelect={(store) => {
              setSelectedStore(store);
              setCurrentScreen("detail");
            }}
            initialPrefecture={searchPrefecture}
            onSettingsOpen={() => setCurrentScreen("settings")}
          />
        );
      case "detail":
        return (
          <StoreDetail
            store={selectedStore}
            onBack={() => {
              setSelectedStore(null);
              setCurrentScreen("home");
            }}
            onSettingsOpen={() => setCurrentScreen("settings")}
            stores={stores}
            setStores={setStores}
            refreshStores={refreshStores}
          />
        );
      case "add":
        return (
          <StoreAdd
            onClose={() => setCurrentScreen("home")}
            setStores={setStores}
            stores={stores}
          />
        );
      case "settings":
        return (
          <Settings
            onBack={() => setCurrentScreen("home")}
            stores={stores}
            setStores={setStores}
            refreshStores={refreshStores} // ← Settings に渡す（必須）
            onAddStore={() => setCurrentScreen("add")}
          />
        );
      case "home":
      default:
        return (
          <Home
            stores={stores}
            setStores={setStores}
            onSearchOpen={(prefecture) => {
              setSearchPrefecture(prefecture || null);
              setCurrentScreen("search");
            }}
            onSettingsOpen={() => setCurrentScreen("settings")}
            onAddStore={() => setCurrentScreen("add")}
            onStoreSelect={(store) => {
              setSelectedStore(store);
              setCurrentScreen("detail");
            }}
          />
        );
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Starbucks Visited Web</h1>
      {user ? (
        <>
          <p
            style={{
              display: "flex",
              justifyContent: "flex-end",
              margin: "10px 0",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "auto" }}>
              こんにちは、{user.displayName} さん
            </span>
            <button
              onClick={() => signOut(auth)}
              style={{
                fontSize: "0.8em",
                padding: "6px 12px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              title="ログアウト"
            >
              ログアウト
            </button>
          </p>
          {renderScreen()}
        </>
      ) : (
        <button
          onClick={() => signInWithPopup(auth, provider)}
          style={{
            fontSize: "1em",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Googleでログイン
        </button>
      )}
    </div>
  );
}

export default App;
