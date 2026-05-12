/**
 * Base URL of peakd-api (no trailing slash), e.g. http://localhost:3001
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (e.g. NEXT_PUBLIC_API_URL=http://localhost:3001)",
    );
  }
  return raw.replace(/\/+$/, "");
}
