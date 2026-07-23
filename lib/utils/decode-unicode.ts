/**
 * Decodes Unicode escape sequences that arrive as literal text from an API or
 * database, while leaving normal Chinese and English text unchanged.
 */
export function decodeUnicode(value: string | null | undefined) {
  if (typeof value !== "string" || !value) return value ?? "";

  return value
    .replace(/\\+u\{([0-9a-fA-F]+)\}/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\\+u([0-9a-fA-F]{4})/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
}

/**
 * Recursively decodes literal Unicode escape sequences in API/database data.
 * Keeps the input shape intact for JSON-like values used by the app.
 */
export function decodeUnicodeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return decodeUnicode(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodeUnicodeDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    if (value instanceof Date) return value;

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        decodeUnicodeDeep(nestedValue),
      ]),
    ) as T;
  }

  return value;
}
