import React from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function LoginButton() {
  const handleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("ログイン成功", result.user);
      })
      .catch((error) => {
        console.error("ログイン失敗", error);
      });
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div>
      <button onClick={handleLogin}>ログイン（Google）</button>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
}
