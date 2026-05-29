export type SocialVideoVariantKind = "reel" | "story" | "post";

export type SocialVideoVariant = {
  kind: SocialVideoVariantKind;
  label: string;
  aspectRatio: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
};

const KIND_ORDER: SocialVideoVariantKind[] = ["reel", "story", "post"];

export function normalizeSocialVideoVariants(
  raw: unknown,
): SocialVideoVariant[] {
  if (!Array.isArray(raw)) return [];
  const out: SocialVideoVariant[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const kind = o.kind;
    if (kind !== "reel" && kind !== "story" && kind !== "post") continue;
    const label = typeof o.label === "string" ? o.label.trim() : kind;
    const aspectRatio =
      typeof o.aspectRatio === "string" ? o.aspectRatio.trim() : "";
    const videoUrl =
      typeof o.videoUrl === "string" && o.videoUrl.trim()
        ? o.videoUrl.trim()
        : null;
    const thumbnailUrl =
      typeof o.thumbnailUrl === "string" && o.thumbnailUrl.trim()
        ? o.thumbnailUrl.trim()
        : null;
    const downloadUrl =
      typeof o.downloadUrl === "string" && o.downloadUrl.trim()
        ? o.downloadUrl.trim()
        : null;
    out.push({
      kind,
      label: label || kind,
      aspectRatio: aspectRatio || (kind === "post" ? "1:1" : "9:16"),
      videoUrl,
      thumbnailUrl,
      downloadUrl,
    });
  }
  out.sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
  return out;
}
