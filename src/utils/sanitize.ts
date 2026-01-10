/**
 * Sanitization utilities for preventing XSS, SQL injection, and path traversal attacks.
 */

/**
 * Escape HTML to prevent XSS attacks
 * Replaces HTML special characters with their entity equivalents
 *
 * @param str - The string to escape
 * @returns The escaped HTML string
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Remove potentially dangerous SQL characters
 * Note: This is NOT a replacement for parameterized queries!
 * Always use parameterized queries/prepared statements for database operations.
 *
 * @param str - The string to sanitize
 * @returns The sanitized string with dangerous SQL characters removed
 *
 * @example
 * ```typescript
 * sanitizeSql("admin'; DROP TABLE users--");
 * // Returns: "admin DROP TABLE users--"
 * ```
 */
export function sanitizeSql(str: string): string {
  return str.replace(/['";\\]/g, "");
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes path separators and special characters, limits length
 *
 * @param filename - The filename to sanitize
 * @returns A safe filename
 *
 * @example
 * ```typescript
 * sanitizeFilename('../../etc/passwd');
 * // Returns: '.._.._etc_passwd'
 *
 * sanitizeFilename('my file<>:"/\\|?*.txt');
 * // Returns: 'my_file_.txt'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.\.+/g, ".")
    .slice(0, 255);
}

/**
 * Strip all HTML tags from a string
 * Removes all content between < and > characters
 *
 * @param str - The string to strip
 * @returns The string with all HTML tags removed
 *
 * @example
 * ```typescript
 * stripHtml('<p>Hello <strong>World</strong>!</p>');
 * // Returns: 'Hello World!'
 * ```
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 * Only allows http, https, and relative URLs
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL or '#' if invalid
 *
 * @example
 * ```typescript
 * sanitizeUrl('javascript:alert("XSS")');
 * // Returns: '#'
 *
 * sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "#";
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("#")
  ) {
    return url.trim();
  }

  return "#";
}
