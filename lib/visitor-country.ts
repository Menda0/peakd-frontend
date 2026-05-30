const COUNTRY_CODE = /^[A-Z]{2}$/;

const GEO_HEADER_KEYS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
] as const;

function normalizeCountryCode(raw: string | null | undefined): string | null {
  const value = raw?.trim().toUpperCase();
  if (!value || !COUNTRY_CODE.test(value)) return null;
  return value;
}

/** Best-effort visitor country from common CDN / edge headers. */
export function getVisitorCountryCode(
  headers: Headers | { get(name: string): string | null },
): string | null {
  for (const key of GEO_HEADER_KEYS) {
    const code = normalizeCountryCode(headers.get(key));
    if (code) return code;
  }
  return null;
}
