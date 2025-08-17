import React from "react";
import { signInWithRedirect, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function LoginButton() {
  const handleLogin = () => {
    // Popup を Redirect に変更（モバイル Chrome でのログイン対応）
    signInWithRedirect(auth, provider);
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
