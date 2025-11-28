import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCR_OLFTogohGMN0fWocGh3V9K1uBgtKPI",
  authDomain: "test-98925.firebaseapp.com",
  projectId: "test-98925",
  storageBucket: "test-98925.firebasestorage.app",
  messagingSenderId: "868930427893",
  appId: "1:868930427893:web:6c7cb3896288f8d3bd1ebc",
  measurementId: "G-QQZ55JP963"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Analytics (only in browser)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Messaging (only in browser)
let messaging: Messaging | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Failed to initialize Firebase Messaging:', error);
  }
}

export { app, analytics, messaging, getToken, onMessage };

