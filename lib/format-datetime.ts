/** Fixed English labels — avoids `Intl` differences between Node and browsers. */
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const DISPLAY_LOCALE = "en-US";

/** Stable `MMM d, yyyy, h:mm AM/PM` in the viewer's local timezone. */
export function formatDateTimeMedium(isoOrMs: string | number): string {
  const ms = typeof isoOrMs === "number" ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(ms)) {
    return String(isoOrMs);
  }
  const d = new Date(ms);
  const month = MONTHS_SHORT[d.getMonth()] ?? "???";
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

export function enrichSharedSessionViewData<T extends { waves: { createdAt: string }[] }>(
  data: T,
): T & { waves: (T["waves"][number] & { createdAtLabel: string })[] } {
  return {
    ...data,
    waves: data.waves.map((wave) => ({
      ...wave,
      createdAtLabel: formatDateTimeMedium(wave.createdAt),
    })),
  };
}
