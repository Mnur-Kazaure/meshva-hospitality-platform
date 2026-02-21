export function readCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return undefined;
  }

  const value = cookie.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}
