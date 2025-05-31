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
