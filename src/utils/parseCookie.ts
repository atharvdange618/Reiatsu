/**
 * Parses a cookie string into an object mapping cookie names to their values.
 *
 * Splits the input string by semicolons, trims whitespace, and decodes each cookie value.
 * Handles cookies with and without values, and gracefully falls back if decoding fails.
 *
 * @param cookieString - The raw cookie string (e.g., from `document.cookie` or HTTP headers).
 * @returns An object where each key is a cookie name and each value is the corresponding cookie value.
 */
export function parseCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) {
    return cookies;
  }

  cookieString.split(";").forEach((cookie) => {
    const trimmedCookie = cookie.trim();
    if (!trimmedCookie) return;

    const equalIndex = trimmedCookie.indexOf("=");

    if (equalIndex === -1) {
      cookies[trimmedCookie] = "";
    } else {
      const key = trimmedCookie.slice(0, equalIndex).trim();
      let value = trimmedCookie.slice(equalIndex + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
    }
  });

  return cookies;
}
