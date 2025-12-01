import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/globals.css";
import { logError } from "./utils/errorHandler";
import "./config/firebase"; // Firebase初期化

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
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
