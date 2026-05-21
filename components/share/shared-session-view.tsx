"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostHeader } from "@/components/social-feed/post-header";
import { PostMedia } from "@/components/social-feed/post-media";
import { PostSurferBadge } from "@/components/social-feed/post-surfer-badge";
import { VideoThumbnailStrip } from "@/components/studio/session-summary-card";
import { SharedSessionSurferList } from "@/components/share/shared-session-surfer-list";
import {
  SharedSessionWaveClaim,
  type SharedSessionWaveClaimState,
} from "@/components/share/shared-session-wave-claim";
import type { PublicSharedSession, PublicSharedSessionWave } from "@/lib/shared-session";
import {
  downloadFromUrl,
  sharedSessionZipDownloadPath,
} from "@/lib/shared-session";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";

type ViewTab = "feed" | "files";

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
    </div>
  );
}

function sessionLocationLabel(data: PublicSharedSession): string {
  const { session } = data;
  if (session.isUndisclosed) {
    return `Undisclosed · ${session.countryCode}`;
  }
  const spot = session.spotName?.trim();
  const parts = [spot, session.regionName, session.countryCode].filter(Boolean);
  return parts.join(" · ");
}

function downloadFilename(base: string, suffix: string): string {
  const stem = base.replace(/\.[^.]+$/, "") || "video";
  return `${stem}${suffix}`;
}

function OriginalAvailableTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
      Original available
    </span>
  );
}

function WaveDownloadActions({ wave }: { wave: PublicSharedSessionWave }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-white/15 bg-transparent text-zinc-200"
        onClick={() =>
          downloadFromUrl(
            wave.processedDownloadUrl,
            downloadFilename(wave.originalFilename, ".webm"),
          )
        }
      >
        <Download className="size-3.5" aria-hidden />
        <span className="ml-1.5">Processed</span>
      </Button>
      {wave.hasOriginal && wave.originalDownloadUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-white/15 bg-transparent text-zinc-200"
          onClick={() =>
            downloadFromUrl(
              wave.originalDownloadUrl!,
              wave.originalFilename,
            )
          }
        >
          <Download className="size-3.5" aria-hidden />
          <span className="ml-1.5">Original</span>
        </Button>
      ) : null}
    </div>
  );
}

function SharedSessionFeedTab({
  data,
  partnerName,
  location,
  resolveWave,
  onWaveClaimed,
}: {
  data: PublicSharedSession;
  partnerName: string;
  location: string;
  resolveWave: (wave: PublicSharedSessionWave) => SharedSessionWaveClaimState;
  onWaveClaimed: (jobId: string, surfer: SurferProfile) => void;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {data.waves.map((wave) => {
        const waveState = resolveWave(wave);
        return (
        <li key={wave.jobId}>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <PostHeader
              authorName={partnerName}
              authorAvatarUrl={data.partnerAvatarUrl}
              partnerUpload
              timeAgo={wave.createdAtLabel ?? wave.createdAt}
            />
            <PostMedia
              thumbnailUrl={wave.thumbnailUrl}
              videoUrl={wave.videoUrl}
              surfer={waveState.surfer}
              claimWave={
                waveState.surfer ? undefined : (
                  <SharedSessionWaveClaim
                    variant="overlay"
                    wave={waveState}
                    partnerName={partnerName}
                    location={location}
                    onClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
                  />
                )
              }
              playbackId={wave.jobId}
              autoPlayInView
              className="mt-3"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className="truncate text-sm font-medium text-zinc-200"
                  title={wave.originalFilename}
                >
                  {wave.originalFilename}
                </span>
                {wave.hasOriginal ? <OriginalAvailableTag /> : null}
              </div>
              <WaveDownloadActions wave={wave} />
            </div>
          </article>
        </li>
        );
      })}
    </ul>
  );
}

function SharedSessionFilesTab({
  data,
  partnerName,
  location,
  activeJobId,
  resolveWave,
  onToggleWave,
  onWaveClaimed,
}: {
  data: PublicSharedSession;
  partnerName: string;
  location: string;
  activeJobId: string | null;
  resolveWave: (wave: PublicSharedSessionWave) => SharedSessionWaveClaimState;
  onToggleWave: (jobId: string) => void;
  onWaveClaimed: (jobId: string, surfer: SurferProfile) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {data.waves.map((wave) => {
        const waveState = resolveWave(wave);
        const isActive = activeJobId === wave.jobId;
        return (
          <li key={wave.jobId}>
            <Card
              className={cn(
                "border-white/10 bg-white/[0.03] text-zinc-100",
                isActive && "ring-1 ring-primary/40",
              )}
            >
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-4 text-left transition-opacity hover:opacity-90 sm:flex-row sm:items-center"
                    onClick={() => onToggleWave(wave.jobId)}
                  >
                    <VideoThumbnailStrip
                      urls={wave.thumbnailUrls}
                      emptyLabel="Wave"
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-zinc-100">
                          {wave.originalFilename}
                        </span>
                        {wave.hasOriginal ? <OriginalAvailableTag /> : null}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {wave.createdAtLabel ?? wave.createdAt}
                      </span>
                    </div>
                  </button>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <SharedSessionWaveClaim
                      variant="inline"
                      wave={waveState}
                      partnerName={partnerName}
                      location={location}
                      onClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
                    />
                    <WaveDownloadActions wave={wave} />
                  </div>
                </div>
                {isActive ? (
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                    <video
                      key={wave.videoUrl}
                      className="aspect-video w-full"
                      controls
                      playsInline
                      preload="metadata"
                      src={wave.videoUrl}
                    />
                    {waveState.surfer ? (
                      <PostSurferBadge surfer={waveState.surfer} />
                    ) : (
                      <SharedSessionWaveClaim
                        variant="overlay"
                        wave={waveState}
                        partnerName={partnerName}
                        location={location}
                        onClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
                      />
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

type WaveClaimOverride = {
  surfer: SurferProfile;
  canClaim: false;
  claimStatus: "claimed";
};

export function SharedSessionView({ data }: { data: PublicSharedSession }) {
  const [tab, setTab] = useState<ViewTab>("feed");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [claimOverrides, setClaimOverrides] = useState<
    Record<string, WaveClaimOverride>
  >({});
  const waveLabels = data.session.waveTypes.map((id) => waveTypeTitle(id));
  const waveCount = data.waves.length;
  const waveCountLabel =
    waveCount === 1 ? "1 wave" : `${waveCount} waves`;
  const partnerName = data.partnerName?.trim() || "Peakd session";
  const location = sessionLocationLabel(data);
  const zipReady = data.exports.processedReady;

  const resolveWave = useCallback(
    (wave: PublicSharedSessionWave): SharedSessionWaveClaimState => {
      const override = claimOverrides[wave.jobId];
      if (!override) return wave;
      return { ...wave, ...override };
    },
    [claimOverrides],
  );

  const handleWaveClaimed = useCallback(
    (jobId: string, surfer: SurferProfile) => {
      setClaimOverrides((prev) => ({
        ...prev,
        [jobId]: {
          surfer,
          canClaim: false,
          claimStatus: "claimed",
        },
      }));
    },
    [],
  );

  const toggleWave = (jobId: string) => {
    setActiveJobId((current) => (current === jobId ? null : jobId));
  };

  const sessionSurfers = useMemo(() => {
    const surfers: SurferProfile[] = [];
    for (const wave of data.waves) {
      const override = claimOverrides[wave.jobId];
      const surfer = override?.surfer ?? wave.surfer;
      if (surfer) surfers.push(surfer);
    }
    return surfers;
  }, [data.waves, claimOverrides]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            {data.partnerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.partnerAvatarUrl}
                alt=""
                className="size-12 shrink-0 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div
                className="size-12 shrink-0 rounded-full border border-white/10 bg-white/5"
                aria-hidden
              />
            )}
            <div>
              <p className="text-sm text-zinc-500">Shared session</p>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
                {partnerName}
              </h1>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-white/15 bg-transparent text-zinc-200"
            disabled={!zipReady}
            title={
              zipReady
                ? "Download all processed waves and snapshots (ZIP)"
                : "Session export is still preparing"
            }
            onClick={() => {
              window.open(
                sharedSessionZipDownloadPath(data.shareToken),
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <Download className="size-4" aria-hidden />
            <span className="ml-2">
              {zipReady ? "Download session ZIP" : "ZIP preparing…"}
            </span>
          </Button>
        </div>

        <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-medium text-zinc-100">
                {data.session.sessionDate} · {data.session.sessionTime}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {sessionLocationLabel(data)} ·{" "}
                {formatDurationMinutes(data.session.durationMinutes)}
              </p>
            </div>
            <ConditionsStars rating={data.session.conditionsRating} />
            <div className="flex flex-wrap items-center gap-1.5">
              {waveLabels.length > 0 ? (
                waveLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex max-w-full items-center truncate rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-600">No wave types</span>
              )}
            </div>
          </CardContent>
        </Card>

        <SharedSessionSurferList surfers={sessionSurfers} />
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {waveCountLabel}
          </h2>
          <div
            className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5"
            role="tablist"
            aria-label="Session view"
          >
            {(
              [
                { id: "feed" as const, label: "Feed" },
                { id: "files" as const, label: "Files" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  tab === id
                    ? "bg-white/10 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {waveCount === 0 ? (
          <p className="text-sm text-zinc-500">No waves in this session yet.</p>
        ) : tab === "feed" ? (
          <SharedSessionFeedTab
            data={data}
            partnerName={partnerName}
            location={location}
            resolveWave={resolveWave}
            onWaveClaimed={handleWaveClaimed}
          />
        ) : (
          <SharedSessionFilesTab
            data={data}
            partnerName={partnerName}
            location={location}
            activeJobId={activeJobId}
            resolveWave={resolveWave}
            onToggleWave={toggleWave}
            onWaveClaimed={handleWaveClaimed}
          />
        )}
      </section>
    </div>
  );
}
