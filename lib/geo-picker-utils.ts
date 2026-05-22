export function isGeoVerified(value: unknown): boolean {
  return value === true || value === 1 || value === "true";
}

function normGeoName(s: string) {
  return s.trim().toLowerCase();
}

/** Items whose name contains the query (matches combobox filter behavior). */
export function filterGeoByQuery<T extends { name: string }>(
  items: T[],
  query: string,
): T[] {
  const q = normGeoName(query);
  if (!q) return items;
  return items.filter((item) => normGeoName(item.name).includes(q));
}

export function sortGeoOptions<T extends { name: string; verified: boolean }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
