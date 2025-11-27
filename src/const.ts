export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "StepNavi";

export const APP_LOGO =
  process.env.NEXT_PUBLIC_APP_LOGO ||
  "/icon-new.png";

const FALLBACK_LOGIN_PATH =
  process.env.NEXT_PUBLIC_FALLBACK_LOGIN_PATH?.trim() || "/signin";
const FALLBACK_SIGNUP_PATH =
  process.env.NEXT_PUBLIC_FALLBACK_SIGNUP_PATH?.trim() || "/signup";

type AuthFlow = "login" | "signup";

const getFallbackAuthPath = (flow: AuthFlow) =>
  flow === "signup" ? FALLBACK_SIGNUP_PATH : FALLBACK_LOGIN_PATH;

const logMissingOauthWarning = (flow: AuthFlow, fallback: string) => {
  if (process.env.NODE_ENV !== 'development') return;
  console.info(
    `[OAuth] Falling back to '${fallback}' for ${flow} because NEXT_PUBLIC_OAUTH_PORTAL_URL or NEXT_PUBLIC_APP_ID is missing. Configure these to enable OAuth login.`
  );
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (flow: AuthFlow = "login") => {
  const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL?.trim();
  const appId = process.env.NEXT_PUBLIC_APP_ID?.trim();

  if (!oauthPortalUrl || !appId) {
    const fallback = getFallbackAuthPath(flow);
    logMissingOauthWarning(flow, fallback);
    return fallback;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const type = flow === "signup" ? "signUp" : "signIn";
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", type);

  return url.toString();
};
