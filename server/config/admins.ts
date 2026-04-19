export const ADMIN_EMAILS = ["k.lelay7@gmail.com"];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
