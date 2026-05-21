import { formatDateTimeMedium } from "@/lib/format-datetime";

/** API stores published sessions as `status: "closed"`. */
export type SurfSessionStatus = "open" | "closed";

export function isSessionPublished(
  status?: SurfSessionStatus | string | null,
): boolean {
  return status === "closed";
}

export function formatSessionPublishedAt(
  closedAt: string | null | undefined,
): string {
  if (!closedAt) return "";
  return ` Published ${formatDateTimeMedium(closedAt)}.`;
}
