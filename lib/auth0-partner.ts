import { decodeJwt } from "jose";
import type { SessionData } from "@auth0/nextjs-auth0/types";

function addRolesFromArray(seen: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    seen.add(String(item).toLowerCase());
  }
}

/** Collect role names from Auth0-style claims (RBAC uses `{API_IDENTIFIER}/roles`). */
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

export function sessionHasPartnerRole(session: SessionData | null | undefined): boolean {
  if (!session?.user) return false;
  if ((session.user as { isPartner?: boolean }).isPartner === true) {
    return true;
  }
  const fromUser = collectRolesFromClaims(session.user as Record<string, unknown>);
  if (fromUser.has("partner")) return true;

  const accessToken = session.tokenSet?.accessToken;
  if (!accessToken) return false;
  try {
    const payload = decodeJwt(accessToken) as Record<string, unknown>;
    return collectRolesFromClaims(payload).has("partner");
  } catch {
    return false;
  }
}
