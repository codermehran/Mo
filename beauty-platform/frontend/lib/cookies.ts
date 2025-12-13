export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const expires = maxAgeSeconds > 0 ? `max-age=${maxAgeSeconds}` : "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${expires}; samesite=lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
