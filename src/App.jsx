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
  const [errorMessage, setErrorMessage] = useState("");

  const allowedEmails = ["ryu0a0t0k@gmail.com", "huckleberry104@gmail.com"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (allowedEmails.includes(currentUser.email)) {
          setUser(currentUser);
          setErrorMessage("");
        } else {
          signOut(auth);
          setUser(null);
          setErrorMessage("このアプリを使えるのは家族のみです。");
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    signInWithPopup(auth, provider).catch((error) => {
      console.error("ログイン失敗:", error);
      setErrorMessage("ログインに失敗しました。");
    });
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("ログアウト失敗:", error);
    });
  };

  return (
    <StoresProvider>
      <Router>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div style={{ flex: 1, padding: 20, fontFamily: "sans-serif" }}>
            <h1>Starbucks Visited Web</h1>

            {errorMessage && (
              <p style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</p>
            )}

            {user ? (
              <>
                <p
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    margin: "10px 0",
                  }}
                >
                  <span style={{ marginRight: "auto" }}>
                    こんにちは、{user.displayName} さん
                  </span>
                  <button
                    onClick={handleLogout}
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
                onClick={handleLogin}
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
