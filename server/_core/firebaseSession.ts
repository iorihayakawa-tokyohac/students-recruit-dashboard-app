import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { getAuth } from "firebase-admin/auth";
import { upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getFirebaseAdminApp } from "./firebaseAdmin";

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
    try {
      const body = sessionSchema.parse(req.body ?? {});
      const auth = getAuth(getFirebaseAdminApp());
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

  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
