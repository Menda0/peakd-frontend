"use client";

import Link from "next/link";
import { BadgeDollarSign, PlayCircle } from "lucide-react";
import { SessionTagsRow } from "@/components/conditions/session-tags-row";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  SESSION_PREVIEW_SLOTS_MOBILE,
} from "@/components/studio/session-summary-card";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";

const SURFER_AVATARS_VISIBLE = 3;

function SurferAvatarStack({ surfers }: { surfers: SearchSessionSurfer[] }) {
  if (surfers.length === 0) return null;
  const visible = surfers.slice(0, SURFER_AVATARS_VISIBLE);
  const overflow = surfers.length - visible.length;

  return (
    <div
      className="flex shrink-0 items-center justify-end"
      role="group"
      aria-label={`${surfers.length} surfer${surfers.length === 1 ? "" : "s"} claimed waves`}
    >
      <div className="flex items-center -space-x-1.5 sm:-space-x-2">
        {visible.map((surfer) => {
          const name = surfer.displayName?.trim() || "Surfer";
          return (
            <div
              key={surfer.userId}
              className="relative size-6 shrink-0 overflow-hidden rounded-full ring-2 ring-card sm:size-7"
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
                  className="flex h-full w-full items-center justify-center bg-muted text-[9px] font-medium text-foreground sm:text-[10px]"
                  aria-hidden
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {overflow > 0 ? (
        <div
          className="relative -ml-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground ring-2 ring-card sm:-ml-2 sm:size-7 sm:text-[10px]"
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
      className="flex min-w-0 max-w-[45%] items-center gap-1.5 sm:max-w-[12rem] sm:gap-2"
      aria-label={`Partner: ${name}, ${typeLabel}`}
    >
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border sm:size-8"
        />
      ) : (
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground ring-1 ring-border sm:size-8 sm:text-xs"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-[11px] font-medium leading-tight text-foreground sm:text-xs">
          {name}
        </p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground">
          {typeLabel}
        </p>
      </div>
    </div>
  );
}

function CommercialIndicator({ isCommercial }: { isCommercial: boolean }) {
  const Icon = isCommercial ? BadgeDollarSign : PlayCircle;
  const label = isCommercial
    ? "Commercial session — waves require unlock"
    : "Free session — waves are free to watch";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border",
            isCommercial
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
              : "bg-muted text-muted-foreground",
          )}
          aria-label={label}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SearchSessionCardBody({
  session,
  className,
  interactive,
}: {
  session: SearchSessionItem;
  className?: string;
  interactive: boolean;
}) {
  const waveLabels = session.waveTypes?.map((id) => waveTypeTitle(id)) ?? [];
  const showPartner = session.author.isPartner;
  const surfers = session.surfers ?? [];
  const showFooter = showPartner || surfers.length > 0;
  const title = session.spotName ?? session.regionName;
  const locationLine = [
    session.spotName ? session.regionName : null,
    session.countryCode,
    formatDurationMinutes(session.durationMinutes),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      className={cn(
        "overflow-hidden border-border bg-card text-foreground transition-colors",
        interactive &&
          "hover:border-primary/40 hover:bg-accent/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex min-w-0 items-start gap-2">
                <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground sm:text-base">
                  {title}
                </p>
                <CommercialIndicator isCommercial={session.isCommercial} />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                {locationLine}
              </p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
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
            slotCount={SESSION_PREVIEW_SLOTS_LIST}
            mobileSlotCount={SESSION_PREVIEW_SLOTS_MOBILE}
            className="w-full shrink-0 sm:w-auto"
          />
        </div>

        {showFooter ? (
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5 sm:pt-3">
            {showPartner ? <PartnerBadge author={session.author} /> : <span />}
            {surfers.length > 0 ? (
              <SurferAvatarStack surfers={surfers} />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SearchSessionCard({
  session,
  className,
}: {
  session: SearchSessionItem;
  className?: string;
}) {
  const href = session.shareToken
    ? `/share/sessions/${encodeURIComponent(session.shareToken)}`
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      {href ? (
        <Link
          href={href}
          className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`Open session at ${session.spotName ?? session.regionName} on ${session.sessionDate}`}
        >
          <SearchSessionCardBody
            session={session}
            className={className}
            interactive
          />
        </Link>
      ) : (
        <SearchSessionCardBody
          session={session}
          className={className}
          interactive={false}
        />
      )}
    </TooltipProvider>
  );
}
