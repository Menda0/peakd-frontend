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
        "flex max-w-[min(100%,11rem)] items-center gap-1.5 rounded-md border border-white/15 bg-black/75 px-1.5 py-1 text-white shadow-lg backdrop-blur-sm sm:max-w-[min(100%,14rem)] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-1.5",
        variant === "overlay" &&
          "pointer-events-none absolute bottom-2 right-2 z-10 max-w-[min(100%-1rem,11rem)] sm:bottom-3 sm:right-3 sm:max-w-[min(100%-1.5rem,14rem)]",
        className,
      )}
      aria-label={`Surfer: ${name}${locationLine ? `, ${locationLine}` : ""}`}
    >
      {surfer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={surfer.avatarUrl}
          alt=""
          className="size-6 shrink-0 rounded-full object-cover ring-1 ring-white/20 sm:size-9"
        />
      ) : (
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-white ring-1 ring-white/20 sm:size-9 sm:text-xs"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-[10px] font-semibold leading-tight text-white sm:text-xs">
          {name}
        </p>
        {locationLine ? (
          <p className="truncate text-[9px] leading-tight text-white/70 sm:text-[10px]">
            {locationLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
