import { englishCountryLabel } from "@/lib/countries";
import type { SurferProfile } from "@/lib/surfer-profile";

export function PostSurferBadge({ surfer }: { surfer: SurferProfile }) {
  const name = surfer.displayName?.trim() || "Surfer";
  const country = englishCountryLabel(surfer.countryCode);
  const region = surfer.regionName?.trim() || null;
  const locationLine = [region, country].filter(Boolean).join(", ");

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 z-10 flex max-w-[min(100%-1.5rem,14rem)] items-center gap-2 rounded-lg border border-white/15 bg-black/75 px-2 py-1.5 shadow-lg backdrop-blur-sm"
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
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-1 ring-white/20"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-semibold leading-tight text-zinc-50">{name}</p>
        {locationLine ? (
          <p className="truncate text-[10px] leading-tight text-zinc-400">{locationLine}</p>
        ) : null}
      </div>
    </div>
  );
}
