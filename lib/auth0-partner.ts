import { decodeJwt } from "jose";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { fetchAuth0UserRoleNames } from "./auth0-management";

function addRolesFromArray(seen: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    seen.add(String(item).toLowerCase());
  }
}

/** Collect role names from Auth0-style claims (RBAC or Actions use `{API_IDENTIFIER}/roles`). */
export function collectRolesFromClaims(claims: Record<string, unknown>): Set<string> {
  const seen = new Set<string>();
  addRolesFromArray(seen, claims.roles);
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (audience) {
    addRolesFromArray(seen, claims[`${audience}/roles`]);
  }
  for (const [key, value] of Object.entries(claims)) {
    if (key.endsWith("/roles")) {
      addRolesFromArray(seen, value);
    }
  }
  return seen;
}

function hasPartnerInClaims(claims: Record<string, unknown>): boolean {
  return collectRolesFromClaims(claims).has("partner");
}

/**
 * Resolves partner status from ID-token-shaped `session.user`, the access token, and
 * optionally the Auth0 Management API (see `auth0-management.ts`).
 */
export async function computeIsPartnerForSession(session: SessionData): Promise<boolean> {
  debugger;
  if (hasPartnerInClaims(session.user as Record<string, unknown>)) return true;

  const accessToken = session.tokenSet?.accessToken;
  if (accessToken) {
    try {
      const payload = decodeJwt(accessToken) as Record<string, unknown>;
      if (hasPartnerInClaims(payload)) return true;
    } catch {
      /* ignore malformed JWT */
    }
  }

  if (
    process.env.AUTH0_MANAGEMENT_CLIENT_ID?.trim() &&
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET?.trim()
  ) {
    const names = await fetchAuth0UserRoleNames(session.user.sub);
    if (names.some((n) => n.toLowerCase() === "partner")) return true;
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
