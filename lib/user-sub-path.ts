/** URL-safe first path segment for Auth0 `sub` (may contain `|` etc.). */
export function userSubToPathSegment(sub: string): string {
  return encodeURIComponent(sub);
}

export function pathSegmentMatchesUserSub(
  segment: string,
  sessionSub: string,
): boolean {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // keep segment as-is
  }
  return decoded === sessionSub;
}
