import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/globals.css";
import { logError } from "./utils/errorHandler";
import "./config/firebase"; // Firebase初期化

// Chrome拡張機能のエラーをフィルタリング
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const errorString = args.map((arg) => String(arg)).join(" ");
    // Chrome拡張機能のエラーは無視
    if (
      errorString.includes("chrome-extension://") ||
      errorString.includes("runtime/sendMessage") ||
      errorString.includes("message port closed")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Firebase Messaging Service Worker登録（プッシュ通知のため、開発環境でも必要）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // firebase-messaging-sw.jsを登録
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        if (import.meta.env.DEV) {
          console.log("Firebase Messaging SW registered:", registration);
        }
      })
      .catch((error) => {
        logError(error, {
          component: "main",
          action: "firebaseMessagingSWRegistration",
        });
      });

    // 通常のService Workerも登録（PWA機能用）
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        if (import.meta.env.DEV) {
          console.log("PWA SW registered:", registration);
        }
      })
      .catch((error) => {
        logError(error, {
          component: "main",
          action: "serviceWorkerRegistration",
        });
      });
  });
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Google Client IDが設定されていない場合の警告
if (!googleClientId && import.meta.env.DEV) {
  console.warn(
    "⚠️ VITE_GOOGLE_CLIENT_ID is not set. Google OAuth will not work."
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
