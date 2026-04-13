export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Build login URL pointing to our own Google OAuth route.
// The server (/api/auth/google) redirects to Google consent screen,
// then handles the callback at /api/auth/google/callback.
export const getLoginUrl = (returnPath?: string) => {
  const safeReturn = returnPath && returnPath.startsWith("/") ? returnPath : "/maison";
  return `/api/auth/google?returnPath=${encodeURIComponent(safeReturn)}`;
};
