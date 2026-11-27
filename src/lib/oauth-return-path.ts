export function oauthReturnPath(value: unknown): string {
  // eslint-disable-next-line no-control-regex -- Reject control characters before URL normalization.
  const invalidCharacters = /[\\\u0000-\u001f\u007f]/;
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    invalidCharacters.test(value)
  ) {
    return "/";
  }
  const origin = "https://app.invalid";
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || target.pathname.startsWith("//")) return "/";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/";
  }
}
