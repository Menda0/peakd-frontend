"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SearchSessionItem } from "@/lib/feed-search";
import {
  SessionPreviewThumbs,
  SESSION_PREVIEW_SLOTS_LIST,
} from "@/components/studio/session-summary-card";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";

function ConditionsStars({ rating }: { rating: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">Conditions</span>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={
          rating != null ? `${rating} out of 5 stars` : "Conditions not rated"
        }
      >
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Star
            key={n}
            className={cn(
              "size-3.5 shrink-0",
              rating != null && n <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-zinc-600",
            )}
            aria-hidden
          />
        ))}
      </div>
      {rating == null ? (
        <span className="text-xs text-zinc-600">Not rated</span>
      ) : null}
    </div>
  );
}

export function SearchSessionCard({
  session,
  className,
}: {
  session: SearchSessionItem;
  className?: string;
}) {
  const waveLabels = session.waveTypes?.map((id) => waveTypeTitle(id)) ?? [];
  const authorName = session.author.displayName ?? "Surfer";

  return (
    <Card
      className={cn(
        "border-white/10 bg-white/[0.03] text-zinc-100",
        className,
      )}
    >
      <CardContent className="flex items-stretch gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {session.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.author.avatarUrl}
                alt=""
                className="size-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 ring-1 ring-white/10"
                aria-hidden
              >
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">
                {authorName}
                {session.author.isPartner ? (
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-primary">
                    Partner
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium text-zinc-100">
                {session.spotName ?? session.regionName}
              </span>
              <span className="text-sm text-zinc-500">
                {session.sessionDate} · {session.sessionTime}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {session.spotName ? `${session.regionName} · ` : ""}
              {session.countryCode} · {formatDurationMinutes(session.durationMinutes)}
            </p>
          </div>

          <ConditionsStars rating={session.conditionsRating} />

          <div className="flex flex-wrap items-center gap-1.5">
            {waveLabels.length > 0 ? (
              waveLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex max-w-full items-center truncate rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300"
                  title={label}
                >
                  {label}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600">No wave types</span>
            )}
          </div>
        </div>

        <SessionPreviewThumbs
          urls={session.previewThumbnailUrls}
          videoCount={session.videoCount}
          slotCount={SESSION_PREVIEW_SLOTS_LIST}
        />
      </CardContent>
    </Card>
  );
}
