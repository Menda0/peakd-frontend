"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PARTNER_TYPE_LABELS,
  type SearchSessionAuthor,
  type SearchSessionItem,
  type SearchSessionSurfer,
} from "@/lib/feed-search";
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

const SURFER_AVATARS_VISIBLE = 5;

function SurferAvatarStack({ surfers }: { surfers: SearchSessionSurfer[] }) {
  if (surfers.length === 0) return null;
  const visible = surfers.slice(0, SURFER_AVATARS_VISIBLE);
  const overflow = surfers.length - visible.length;

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label={`${surfers.length} surfer${surfers.length === 1 ? "" : "s"} claimed waves`}
    >
      {visible.map((surfer, idx) => {
        const name = surfer.displayName?.trim() || "Surfer";
        return (
          <div
            key={surfer.userId}
            className={cn(
              "relative size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-[#040F1E]",
              idx > 0 && "-ml-2",
            )}
            title={name}
            aria-label={name}
          >
            {surfer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={surfer.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-zinc-700 text-[11px] font-semibold text-zinc-200"
                aria-hidden
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      })}
      {overflow > 0 ? (
        <div
          className="relative -ml-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-200 ring-2 ring-[#040F1E]"
          aria-label={`${overflow} more surfer${overflow === 1 ? "" : "s"}`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}

function PartnerBadge({ author }: { author: SearchSessionAuthor }) {
  const name = author.displayName?.trim() || "Partner";
  const typeLabel = author.partnerType
    ? PARTNER_TYPE_LABELS[author.partnerType]
    : "Partner";

  return (
    <div
      className="flex max-w-[min(100%,18rem)] items-center gap-2 rounded-lg border border-white/15 bg-black/75 px-2 py-1.5 shadow-lg backdrop-blur-sm"
      aria-label={`Partner: ${name}, ${typeLabel}`}
    >
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
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
        <p className="truncate text-xs font-semibold leading-tight text-zinc-50">
          {name}
        </p>
        <p className="truncate text-[10px] uppercase leading-tight tracking-wide text-primary">
          {typeLabel}
        </p>
      </div>
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
  const showPartner = session.author.isPartner;
  const surfers = session.surfers ?? [];
  const showFooter = showPartner || surfers.length > 0;

  return (
    <Card
      className={cn(
        "border-white/10 bg-white/[0.03] text-zinc-100",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-stretch gap-4">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
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
                {session.countryCode} ·{" "}
                {formatDurationMinutes(session.durationMinutes)}
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
        </div>

        {showFooter ? (
          <div className="flex items-center gap-3">
            {showPartner ? <PartnerBadge author={session.author} /> : null}
            <div className="ml-auto">
              <SurferAvatarStack surfers={surfers} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
