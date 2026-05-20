"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";

export type SurfSessionSummary = {
  sessionId: string;
  status?: "open" | "closed";
  countryCode: string;
  regionId: string;
  spotId: string;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: string[];
  spotName?: string;
  regionName?: string;
  videoCount: number;
  previewThumbnailUrls: string[];
};

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

export const SESSION_PREVIEW_SLOTS_LIST = 3;
export const SESSION_PREVIEW_SLOTS_DETAIL = 4;
export const VIDEO_JOB_THUMBNAIL_SLOTS = 4;

function SessionPreviewThumbs({
  urls,
  videoCount,
  slotCount = SESSION_PREVIEW_SLOTS_LIST,
}: {
  urls: string[];
  videoCount: number;
  slotCount?: number;
}) {
  const slots = Array.from({ length: slotCount }, (_, i) => i);
  const videoLabel = videoCount === 1 ? "1 wave" : `${videoCount} waves`;

  return (
    <div className="flex shrink-0 flex-col items-end justify-center gap-2">
      <div className="flex items-center gap-2.5">
        <span className="whitespace-nowrap text-xs font-medium tabular-nums text-zinc-400">
          {videoLabel}
        </span>
        <div className="flex items-stretch gap-1.5">
          {slots.map((i) => {
            const url = urls[i];
            return (
              <div
                key={i}
                className={cn(
                  "relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-lg border border-white/10 bg-zinc-800 sm:h-20 sm:w-[4.75rem]",
                  i === 0 && videoCount > 0 && !url && "animate-pulse",
                )}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight text-zinc-600">
                    {videoCount > 0 && i === 0 ? "…" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function VideoThumbnailStrip({
  urls,
  slotCount = VIDEO_JOB_THUMBNAIL_SLOTS,
  emptyLabel,
  isProcessing = false,
  className,
}: {
  urls: string[];
  slotCount?: number;
  emptyLabel?: string;
  isProcessing?: boolean;
  className?: string;
}) {
  const slots = Array.from({ length: slotCount }, (_, i) => i);

  return (
    <div className={cn("flex shrink-0 items-stretch gap-1.5", className)}>
      {slots.map((i) => {
        const url = urls[i];
        return (
          <div
            key={i}
            className={cn(
              "relative h-20 w-[4.25rem] overflow-hidden rounded-lg border border-white/10 bg-zinc-800 sm:w-[4.5rem]",
              (isProcessing || (i === 0 && urls.length === 0 && !emptyLabel)) &&
                "animate-pulse",
            )}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight text-zinc-500">
                {emptyLabel && i === 0 ? emptyLabel : ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SessionSummaryCard({
  session,
  className,
  previewSlotCount = SESSION_PREVIEW_SLOTS_LIST,
}: {
  session: SurfSessionSummary;
  className?: string;
  previewSlotCount?: number;
}) {
  const waveLabels = session.waveTypes?.map((id) => waveTypeTitle(id)) ?? [];

  return (
    <Card
      className={cn(
        "border-white/10 bg-white/[0.03] text-zinc-100",
        className,
      )}
    >
      <CardContent className="flex items-stretch gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium text-zinc-100">
                {session.spotName ?? "Spot"}
              </span>
              {session.status === "closed" ? (
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Closed
                </span>
              ) : null}
              <span className="text-sm text-zinc-500">
                {session.sessionDate} · {session.sessionTime}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {session.regionName ?? "Region"} · {session.countryCode} ·{" "}
              {formatDurationMinutes(session.durationMinutes ?? 120)}
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
          slotCount={previewSlotCount}
        />
      </CardContent>
    </Card>
  );
}
