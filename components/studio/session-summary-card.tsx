"use client";

import { SessionTagsRow } from "@/components/conditions/session-tags-row";
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

export const SESSION_PREVIEW_SLOTS_MOBILE = 5;
export const SESSION_PREVIEW_SLOTS_LIST = 3;
export const SESSION_PREVIEW_SLOTS_DETAIL = 4;
export const VIDEO_JOB_THUMBNAIL_SLOTS = 4;

export function SessionPreviewThumbs({
  urls,
  videoCount,
  slotCount = SESSION_PREVIEW_SLOTS_LIST,
  mobileSlotCount = SESSION_PREVIEW_SLOTS_MOBILE,
  className,
}: {
  urls: string[];
  videoCount: number;
  slotCount?: number;
  mobileSlotCount?: number;
  className?: string;
}) {
  const totalSlots = Math.max(slotCount, mobileSlotCount);
  const slots = Array.from({ length: totalSlots }, (_, i) => i);
  const videoLabel = videoCount === 1 ? "1 wave" : `${videoCount} waves`;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <div className="flex max-w-full items-stretch justify-center gap-1 overflow-x-auto pb-0.5 sm:gap-1.5">
        {slots.map((i) => {
          const url = urls[i];
          return (
            <div
              key={i}
              className={cn(
                "relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-20 sm:w-[4.75rem]",
                i >= slotCount && "sm:hidden",
                i === 0 && videoCount > 0 && !url && "animate-pulse",
              )}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted-foreground">
                  {videoCount > 0 && i === 0 ? "…" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className="w-full text-center text-xs font-medium tabular-nums text-muted-foreground">
        {videoLabel}
      </span>
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
              "relative h-20 w-[4.25rem] overflow-hidden rounded-lg border border-border bg-muted sm:w-[4.5rem]",
              (isProcessing || (i === 0 && urls.length === 0 && !emptyLabel)) &&
                "animate-pulse",
            )}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted-foreground">
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
        "overflow-hidden border-border bg-card text-foreground",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {session.spotName ?? "Spot"}
                </span>
                {session.status === "closed" ? (
                  <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Published
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.regionName ?? "Region"} · {session.countryCode} ·{" "}
                {formatDurationMinutes(session.durationMinutes ?? 120)}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.sessionDate} · {session.sessionTime}
              </p>
            </div>

            <SessionTagsRow
              conditionsRating={session.conditionsRating}
              waveLabels={waveLabels}
            />
          </div>

          <SessionPreviewThumbs
            urls={session.previewThumbnailUrls}
            videoCount={session.videoCount}
            slotCount={previewSlotCount}
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
}
