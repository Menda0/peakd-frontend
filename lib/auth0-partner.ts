import { decodeJwt } from "jose";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { fetchAuth0UserRoleNames } from "./auth0-management";
import { hasRoleInClaims } from "./auth0-roles";

/**
 * Resolves partner status from ID-token-shaped `session.user`, the access token, and
 * optionally the Auth0 Management API (see `auth0-management.ts`).
 */
export async function computeIsPartnerForSession(session: SessionData): Promise<boolean> {
  if (hasRoleInClaims(session.user as Record<string, unknown>, "partner")) return true;

  const accessToken = session.tokenSet?.accessToken;
  if (accessToken) {
    try {
      const payload = decodeJwt(accessToken) as Record<string, unknown>;
      if (hasRoleInClaims(payload, "partner")) return true;
    } catch {
      /* ignore malformed JWT */
    }
  }

  if (
    process.env.AUTH0_MANAGEMENT_CLIENT_ID?.trim() &&
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET?.trim()
  ) {
    const names = await fetchAuth0UserRoleNames(session.user.sub);
    if (names.some((n) => n === "partner")) return true;
  }

  return false;
}

/** Use after `beforeSessionSaved` has run, or when a live check is needed for older sessions. */
export async function sessionHasPartnerRole(
  session: SessionData | null | undefined,
): Promise<boolean> {
  if (!session?.user) return false;
  if ((session.user as { isPartner?: boolean }).isPartner === true) {
    return true;
  }
  return computeIsPartnerForSession(session);
}

// Re-export for callers that imported from here previously.
export { collectRolesFromClaims } from "./auth0-roles";
