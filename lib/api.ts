/**
 * Same-origin BFF base path (no trailing slash). Proxies to Nest with Auth0 access token.
 */
export function getApiBase(): string {
  return "/api/peakd";
}
