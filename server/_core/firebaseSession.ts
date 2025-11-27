import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function ensureFirebaseAdmin() {
  if (getApps().length) {
    return getApp();
  }

  const rawCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (rawCredentials) {
    try {
      const parsed = JSON.parse(rawCredentials);
      return initializeApp({
        credential: cert(parsed),
      });
    } catch (error) {
      console.error("[Auth] Failed to parse FIREBASE_ADMIN_CREDENTIALS", error);
      // Provide more diagnostic hints in logs to help debug invalid JWT/time issues
      console.error("[Auth] Current server time:", new Date().toISOString(), "(tz:", process.env.TZ || 'unset', ")");
      console.error("[Auth] Make sure FIREBASE_ADMIN_CREDENTIALS contains a valid service account JSON and that the JSON was not mangled when set as env var (e.g. escaped newlines).\nIf running inside a container check the container time is synced and the mounted key file is correct.");
      throw new Error("FIREBASE_ADMIN_CREDENTIALS is invalid JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
      console.error("[Auth] Current server time:", new Date().toISOString(), "(tz:", process.env.TZ || 'unset', ")");
      console.error("[Auth] Potential causes: container/server time skew, revoked/rotated service account key, or an improperly formatted private key.\nCheck key presence in Google Cloud Console IAM -> Service Accounts and/or rotate the key if needed.");
      throw error;
    }
  }

  // Fallback to Application Default Credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
  try {
    return initializeApp();
  } catch (error) {
    console.error("[Auth] Failed to initialize Firebase Admin SDK", error);
    console.error("[Auth] Current server time:", new Date().toISOString(), "(tz:", process.env.TZ || 'unset', ")");
    console.error("[Auth] If you set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file, ensure it's present in the container and not revoked. Also validate the container's time sync.");
    throw new Error(
      "Firebase Admin SDK not configured. Set FIREBASE_ADMIN_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }
}

async function issueSessionCookie(req: Request, res: Response, openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

const sessionSchema = z.object({
  idToken: z.string().min(10),
  displayName: z.string().optional(),
});

export function registerFirebaseSessionRoute(app: Express) {
  app.post("/api/auth/firebase-session", async (req, res) => {
    let firebaseApp;
    try {
      firebaseApp = ensureFirebaseAdmin();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
      return;
    }

    try {
      const body = sessionSchema.parse(req.body ?? {});
      const auth = getAuth(firebaseApp);
      const decoded = await auth.verifyIdToken(body.idToken, true);
      const firebaseUser = await auth.getUser(decoded.uid);

      const email = firebaseUser.email?.toLowerCase();
      if (!email) {
        res.status(400).json({ error: "メールアドレスを取得できませんでした。" });
        return;
      }

      const name =
        body.displayName?.trim() || firebaseUser.displayName || email.split("@")[0] || "";

      await upsertUser({
        openId: firebaseUser.uid,
        email,
        name,
        loginMethod: "firebase",
        lastSignedIn: new Date(),
      });

      await issueSessionCookie(req, res, firebaseUser.uid, name);
      console.log(`[Auth] Session cookie issued for user: ${email} (${firebaseUser.uid})`);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "リクエスト形式が正しくありません。" });
        return;
      }

      console.error("[Auth] Failed to verify Firebase token", error);
      res.status(401).json({ error: "認証に失敗しました。" });
    }
  });
}
