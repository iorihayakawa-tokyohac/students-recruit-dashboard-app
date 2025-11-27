import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";

function logTime() {
  console.error("[Auth] Current server time:", new Date().toISOString(), "(tz:", process.env.TZ || "unset", ")");
}

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const rawCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (rawCredentials) {
    try {
      const parsed = JSON.parse(rawCredentials);
      return initializeApp({ credential: cert(parsed) });
    } catch (error) {
      console.error("[Auth] Failed to parse FIREBASE_ADMIN_CREDENTIALS", error);
      logTime();
      console.error(
        "[Auth] Make sure FIREBASE_ADMIN_CREDENTIALS contains a valid service account JSON and that the JSON was not mangled when set as env var (e.g. escaped newlines).",
      );
      throw new Error("FIREBASE_ADMIN_CREDENTIALS is invalid JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error("[Auth] Failed to initialize App with FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY", error);
      logTime();
      console.error(
        "[Auth] Potential causes: container/server time skew, revoked/rotated service account key, or an improperly formatted private key.\nCheck key presence in Google Cloud Console IAM -> Service Accounts and/or rotate the key if needed.",
      );
      throw error;
    }
  }

  try {
    return initializeApp();
  } catch (error) {
    console.error("[Auth] Failed to initialize Firebase Admin SDK", error);
    logTime();
    console.error(
      "[Auth] If you set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file, ensure it's present in the container and not revoked. Also validate the container's time sync.",
    );
    throw new Error("Firebase Admin SDK not configured. Set FIREBASE_ADMIN_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS.");
  }
}
