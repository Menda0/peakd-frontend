import type { PopularSpot } from "@/lib/social-feed-placeholder";

export function PopularSpotRow({ spot }: { spot: PopularSpot }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-cyan-900/40 to-zinc-900" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{spot.name}</p>
        <p className="truncate text-xs text-zinc-500">{spot.region}</p>
      </div>
    </div>
  );
}
