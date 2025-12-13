export type CookieOptions = {
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
};

const COOKIE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

function normalizeCookieName(name: string): string | null {
  if (!COOKIE_NAME_PATTERN.test(name)) {
    return null;
  }
  return name;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function setCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  options: CookieOptions = {},
) {
  if (typeof document === "undefined") return;
  const safeName = normalizeCookieName(name);
  if (!safeName) return;

  const expires =
    maxAgeSeconds > 0 ? `max-age=${maxAgeSeconds}` : "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const { secure = process.env.NODE_ENV === "production", sameSite = "lax", path = "/" } = options;
  const secureFlag = secure ? "; secure" : "";
  const sameSiteFlag = sameSite ? `; samesite=${sameSite}` : "";

  document.cookie = `${safeName}=${encodeURIComponent(value)}; path=${path}; ${expires}${sameSiteFlag}${secureFlag}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const safeName = normalizeCookieName(name);
  if (!safeName) return null;
  const escapedName = escapeRegExp(safeName);
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
