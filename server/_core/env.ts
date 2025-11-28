const rawOAuthServerUrl = process.env.OAUTH_SERVER_URL;
const oAuthServerUrl =
  typeof rawOAuthServerUrl === "string" ? rawOAuthServerUrl.trim() : "";

const rawAppId = process.env.NEXT_PUBLIC_APP_ID?.trim();
const appId = rawAppId && rawAppId.length > 0 ? rawAppId : "local-app";

const rawCookieSecret = process.env.JWT_SECRET?.trim();
const cookieSecret =
  rawCookieSecret && rawCookieSecret.length > 0 ? rawCookieSecret : "dev-cookie-secret";

const rawForgeApiKey =
  process.env.BUILT_IN_FORGE_API_KEY?.trim() ||
  process.env.OPENAI_API_KEY?.trim() ||
  "";

const rawForgeApiUrl =
  process.env.BUILT_IN_FORGE_API_URL?.trim() ||
  process.env.OPENAI_BASE_URL?.trim() ||
  process.env.OPENAI_API_BASE?.trim() ||
  "";
const rawForgeModel =
  process.env.BUILT_IN_FORGE_MODEL?.trim() ||
  process.env.OPENAI_MODEL?.trim() ||
  "";

export const ENV = {
  appId,
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl,
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: rawForgeApiUrl,
  forgeApiKey: rawForgeApiKey,
  forgeModel: rawForgeModel,
};

export const isOAuthConfigured = oAuthServerUrl.length > 0;
