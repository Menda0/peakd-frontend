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
  size = "default",
  className,
}: {
  surfer: SurferProfile;
  variant?: "overlay" | "inline";
  size?: "default" | "compact";
  className?: string;
}) {
  const name = surfer.displayName?.trim() || "Surfer";
  const locationLine = formatSurferLocation(surfer);
  const compact = size === "compact";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-white/15 bg-black/75 text-white shadow-lg backdrop-blur-sm",
        compact
          ? "max-w-[min(100%,8.5rem)] gap-1 px-1 py-0.5"
          : "max-w-[min(100%,11rem)] gap-1.5 px-1.5 py-1 sm:max-w-[min(100%,14rem)] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5",
        variant === "overlay" &&
          cn(
            "pointer-events-none absolute z-10",
            compact
              ? "bottom-1.5 right-1.5 max-w-[min(100%-0.75rem,8.5rem)]"
              : "bottom-2 right-2 max-w-[min(100%-1rem,11rem)] sm:bottom-3 sm:right-3 sm:max-w-[min(100%-1.5rem,14rem)]",
          ),
        className,
      )}
      aria-label={`Surfer: ${name}${locationLine ? `, ${locationLine}` : ""}`}
    >
      {surfer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={surfer.avatarUrl}
          alt=""
          className={cn(
            "shrink-0 rounded-full object-cover ring-1 ring-white/20",
            compact ? "size-5" : "size-6 sm:size-9",
          )}
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-zinc-700 font-semibold text-white ring-1 ring-white/20",
            compact ? "size-5 text-[9px]" : "size-6 text-[10px] sm:size-9 sm:text-xs",
          )}
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p
          className={cn(
            "truncate font-semibold leading-tight text-white",
            compact ? "text-[9px]" : "text-[10px] sm:text-xs",
          )}
        >
          {name}
        </p>
        {locationLine ? (
          <p
            className={cn(
              "truncate leading-tight text-white/70",
              compact ? "text-[8px]" : "text-[9px] sm:text-[10px]",
            )}
          >
            {locationLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
