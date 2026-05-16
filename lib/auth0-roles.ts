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

export function hasRoleInClaims(claims: Record<string, unknown>, role: string): boolean {
  return collectRolesFromClaims(claims).has(role.toLowerCase());
}
