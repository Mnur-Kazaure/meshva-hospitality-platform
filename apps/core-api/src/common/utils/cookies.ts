export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const separator = entry.indexOf('=');
      if (separator <= 0) {
        return acc;
      }

      const key = decodeURIComponent(entry.slice(0, separator).trim());
      const value = decodeURIComponent(entry.slice(separator + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}
