import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import axios from "axios";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function buildGoogleRedirectUri(): string {
  return `${ENV.appUrl.replace(/\/$/, "")}/api/auth/google/callback`;
}

function encodeReturnPath(returnPath: string | undefined): string {
  const safe = returnPath && returnPath.startsWith("/") ? returnPath : "/maison";
  return Buffer.from(JSON.stringify({ returnPath: safe })).toString("base64");
}

function decodeReturnPath(state: string | undefined): string {
  if (!state) return "/maison";
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.returnPath === "string" && parsed.returnPath.startsWith("/")) {
      return parsed.returnPath;
    }
  } catch {
    // ignore
  }
  return "/maison";
}

export function registerOAuthRoutes(app: Express) {
  // ─── Google OAuth: redirect to consent screen ──────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      return;
    }

    const returnPath = getQueryParam(req, "returnPath");
    const state = encodeReturnPath(returnPath);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", ENV.googleClientId);
    authUrl.searchParams.set("redirect_uri", buildGoogleRedirectUri());
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("prompt", "select_account");

    res.redirect(302, authUrl.toString());
  });

  // ─── Google OAuth: callback ────────────────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    if (error) {
      console.error("[GoogleOAuth] Consent error:", error);
      res.redirect(302, "/auth?error=oauth_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Google OAuth credentials not configured" });
      return;
    }

    try {
      // 1. Exchange code for token
      const tokenResp = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: buildGoogleRedirectUri(),
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const accessToken = tokenResp.data?.access_token as string | undefined;
      if (!accessToken) {
        throw new Error("No access_token in Google response");
      }

      // 2. Fetch user profile
      const profileResp = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const profile = profileResp.data as {
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
      };

      if (!profile.id) {
        res.status(400).json({ error: "Google profile missing id" });
        return;
      }

      // 3. Upsert user
      const openId = `google:${profile.id}`;
      await db.upsertUser({
        openId,
        name: profile.name || null,
        email: profile.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // 4. Create JWT session token (compatible with existing sdk.verifySession)
      const sessionToken = await sdk.signSession(
        { openId, appId: ENV.appId || "baymora", name: profile.name || "" },
        { expiresInMs: ONE_YEAR_MS }
      );

      // 5. Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
        sameSite: "lax",
      });

      // 6. Redirect to returnPath
      res.redirect(302, decodeReturnPath(state));
    } catch (err: any) {
      console.error("[GoogleOAuth] Callback failed:", err?.response?.data || err?.message || err);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });

  // ─── Legacy alias for backwards compat ─────────────────────────────────
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    // Forward query string to /api/auth/google so any returnPath is preserved
    const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    res.redirect(302, `/api/auth/google${qs}`);
  });
}
