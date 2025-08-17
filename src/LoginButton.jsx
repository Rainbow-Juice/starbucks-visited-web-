import React from "react";
import { signInWithPopup, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function LoginButton() {
  const handleLogin = () => {
    // 永続ログインを設定
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return signInWithPopup(auth, provider);
      })
      .then((result) => {
        console.log("ログイン成功", result.user);
      })
      .catch((error) => {
        console.error("ログイン失敗", error);
      });
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("ログアウト成功");
      })
      .catch((error) => {
        console.error("ログアウト失敗", error);
      });
  };

  return (
    <div>
      <button onClick={handleLogin}>ログイン（Google）</button>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
}
