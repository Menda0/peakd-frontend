import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";

function formatSurferLocation(surfer: SurferProfile): string | null {
  const region = surfer.regionName?.trim() || null;
  const countryCode = surfer.countryCode?.trim().toUpperCase() || null;
  const parts = [region, countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function PostSurferBadge({
  surfer,
  variant = "overlay",
  className,
}: {
  surfer: SurferProfile;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const name = surfer.displayName?.trim() || "Surfer";
  const locationLine = formatSurferLocation(surfer);

  return (
    <div
      className={cn(
        "flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border border-border bg-black/75 px-2 py-1.5 shadow-lg backdrop-blur-sm",
        variant === "overlay" &&
          "pointer-events-none absolute bottom-3 right-3 z-10 max-w-[min(100%-1.5rem,14rem)]",
        className,
      )}
      aria-label={`Surfer: ${name}${locationLine ? `, ${locationLine}` : ""}`}
    >
      {surfer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={surfer.avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/20"
        />
      ) : (
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-foreground ring-1 ring-white/20"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-semibold leading-tight text-foreground">{name}</p>
        {locationLine ? (
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{locationLine}</p>
        ) : null}
      </div>
    </div>
  );
}
