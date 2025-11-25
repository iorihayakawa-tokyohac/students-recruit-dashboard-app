import type { FirebaseApp } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

type ConfigKey = keyof typeof firebaseConfig;

const ENV_NAME: Record<ConfigKey, string> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
  measurementId: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
};

const REQUIRED_KEYS: ConfigKey[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;
let configLogged = false;

function mask(value: string | undefined | null) {
  if (!value) return "<missing>";
  if (value.length <= 8) return "<set>";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function logConfigStatus() {
  if (configLogged) return;
  const summary = Object.entries(firebaseConfig).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key] = mask(value);
      return acc;
    },
    {}
  );
  console.info("[Firebase] Config status", summary);
  configLogged = true;
}

function assertConfig() {
  const missingKeys = REQUIRED_KEYS.filter(key => {
    const value = firebaseConfig[key];
    return typeof value !== "string" || value.trim() === "";
  });

  logConfigStatus();

  if (missingKeys.length > 0) {
    const envNames = missingKeys.map(key => ENV_NAME[key]).join(", ");
    throw new Error(`[Firebase] Missing required environment variables: ${envNames}`);
  }
}

function getClientApp(): FirebaseApp {
  if (!isBrowser) {
    throw new Error("Firebase client APIs are only available in the browser.");
  }
  if (!app) {
    assertConfig();
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  return getClientApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getClientApp());
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getClientApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getClientApp());
}
