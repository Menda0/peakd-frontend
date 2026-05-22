export type AdminActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function textOrStatus(res: Response, body: string): string {
  const t = body.trim();
  return t || res.statusText || `Request failed (${res.status})`;
}
