const rawOAuthServerUrl = process.env.OAUTH_SERVER_URL;
const oAuthServerUrl =
  typeof rawOAuthServerUrl === "string" ? rawOAuthServerUrl.trim() : "";

const rawAppId = process.env.NEXT_PUBLIC_APP_ID?.trim();
const appId = rawAppId && rawAppId.length > 0 ? rawAppId : "local-app";

const rawCookieSecret = process.env.JWT_SECRET?.trim();
const cookieSecret =
  rawCookieSecret && rawCookieSecret.length > 0 ? rawCookieSecret : "dev-cookie-secret";

export const ENV = {
  appId,
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl,
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export const isOAuthConfigured = oAuthServerUrl.length > 0;
