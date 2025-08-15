// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

import Home from "./components/Home";
import StoreSearch from "./components/StoreSearch";
import StoreDetail from "./components/StoreDetail";
import StoreAdd from "./components/StoreAdd";
import Settings from "./components/Settings";
import StoreListByPrefecture from "./components/StoreListByPrefecture";
import HelpModal from "./components/HelpModal";
import Footer from "./components/Footer";

import { StoresProvider } from "./context/StoresContext";

export default function App() {
  const [user, setUser] = useState(null);

  // 認証状態監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <StoresProvider>
      <Router>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div style={{ flex: 1, padding: 20, fontFamily: "sans-serif" }}>
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

                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/add" element={<StoreAdd />} />
                  <Route path="/store/:id" element={<StoreDetail />} />
                  <Route path="/prefecture/:prefecture" element={<StoreListByPrefecture />} />
                  <Route path="/search" element={<StoreSearch />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<HelpModal />} />
                </Routes>
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

          <Footer />
        </div>
      </Router>
    </StoresProvider>
  );
}
