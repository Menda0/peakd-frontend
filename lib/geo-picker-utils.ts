export function isGeoVerified(value: unknown): boolean {
  return value === true || value === 1 || value === "true";
}

export function sortGeoOptions<T extends { name: string; verified: boolean }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
