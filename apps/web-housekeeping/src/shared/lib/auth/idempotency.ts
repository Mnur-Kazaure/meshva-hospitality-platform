export function buildIdempotencyKey(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const ts = Date.now();
  return `${prefix}-${ts}-${random}`;
}
