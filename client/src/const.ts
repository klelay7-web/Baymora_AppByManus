export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Safety check : evite le crash new URL() si les vars d'env sont absentes
  if (!oauthPortalUrl || !appId) return "/auth";

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode returnPath in state so OAuth callback can redirect back after login
  const stateData = returnPath
    ? JSON.stringify({ redirectUri, returnPath })
    : redirectUri;
  const state = btoa(stateData);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
