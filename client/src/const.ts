export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO || "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

const FALLBACK_LOGIN_PATH =
  import.meta.env.VITE_FALLBACK_LOGIN_PATH?.trim() || "/signin";
const FALLBACK_SIGNUP_PATH =
  import.meta.env.VITE_FALLBACK_SIGNUP_PATH?.trim() || "/signup";

type AuthFlow = "login" | "signup";

const getFallbackAuthPath = (flow: AuthFlow) =>
  flow === "signup" ? FALLBACK_SIGNUP_PATH : FALLBACK_LOGIN_PATH;

const logMissingOauthWarning = (flow: AuthFlow, fallback: string) => {
  if (!import.meta.env.DEV) return;
  console.info(
    `[OAuth] Falling back to '${fallback}' for ${flow} because VITE_OAUTH_PORTAL_URL or VITE_APP_ID is missing. Configure these to enable OAuth login.`
  );
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (flow: AuthFlow = "login") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();

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
