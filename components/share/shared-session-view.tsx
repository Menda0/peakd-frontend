"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommercialWaveActions } from "@/components/social-feed/commercial-wave-actions";
import { PostHeader } from "@/components/social-feed/post-header";
import { PostMedia } from "@/components/social-feed/post-media";
import { PostSurferBadge } from "@/components/social-feed/post-surfer-badge";
import { VideoPostCard } from "@/components/social-feed/video-post-card";
import { WaveSnapshotCarousel } from "@/components/social-feed/wave-snapshot-carousel";
import { VideoThumbnailStrip } from "@/components/studio/session-summary-card";
import { ShareBackButton } from "@/components/share/share-back-button";
import { SharedSessionSurferList } from "@/components/share/shared-session-surfer-list";
import {
  SharedSessionWaveClaim,
  type SharedSessionWaveClaimState,
} from "@/components/share/shared-session-wave-claim";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PublicSharedSession, PublicSharedSessionWave } from "@/lib/shared-session";
import {
  downloadFromUrl,
  fetchAuthenticatedSharedSession,
  sharedSessionToFeedLocation,
  sharedSessionToFeedSession,
  sharedSessionWaveToDiscoverPost,
  sharedSessionZipDownloadPath,
} from "@/lib/shared-session";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";

type ViewTab = "feed" | "files";

function ConditionsStars({ rating }: { rating: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Conditions</span>
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
                : "fill-transparent text-muted-foreground",
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
  const socialDownloads = wave.socialVariants.filter((v) => v.downloadUrl);
  if (!wave.processedDownloadUrl && socialDownloads.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {wave.processedDownloadUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-border bg-transparent text-foreground"
          onClick={() =>
            downloadFromUrl(
              wave.processedDownloadUrl!,
              downloadFilename(wave.originalFilename, ".webm"),
            )
          }
        >
          <Download className="size-3.5" aria-hidden />
          <span className="ml-1.5">Processed</span>
        </Button>
      ) : null}
      {socialDownloads.map((variant) => (
        <Button
          key={variant.kind}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-border bg-transparent text-foreground"
          onClick={() =>
            downloadFromUrl(
              variant.downloadUrl!,
              downloadFilename(wave.originalFilename, `-${variant.kind}.mp4`),
            )
          }
        >
          <Download className="size-3.5" aria-hidden />
          <span className="ml-1.5">{variant.label}</span>
        </Button>
      ))}
      {wave.hasOriginal && wave.originalDownloadUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-border bg-transparent text-foreground"
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

function SharedSessionCommercialFeedTab({
  posts,
  onUnlockChanged,
}: {
  posts: DiscoverFeedPost[];
  onUnlockChanged: () => void;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <VideoPostCard
            post={post}
            onCommercialPurchased={onUnlockChanged}
            onCommercialClaimed={onUnlockChanged}
          />
        </li>
      ))}
    </ul>
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
          <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <PostHeader
              authorName={partnerName}
              authorAvatarUrl={data.partnerAvatarUrl}
              partnerUpload
              timeAgo={wave.createdAtLabel ?? wave.createdAt}
            />
            <PostMedia
              thumbnailUrl={wave.thumbnailUrl}
              videoUrl={wave.videoUrl ?? undefined}
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
                  className="truncate text-sm font-medium text-foreground"
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
  onUnlockChanged,
  commercialPostsByJobId,
}: {
  data: PublicSharedSession;
  partnerName: string;
  location: string;
  activeJobId: string | null;
  resolveWave: (wave: PublicSharedSessionWave) => SharedSessionWaveClaimState;
  onToggleWave: (jobId: string) => void;
  onWaveClaimed: (jobId: string, surfer: SurferProfile) => void;
  onUnlockChanged: () => void;
  commercialPostsByJobId: Map<string, DiscoverFeedPost>;
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
                "border-border bg-card text-foreground",
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
                        <span className="truncate font-medium text-foreground">
                          {wave.originalFilename}
                        </span>
                        {wave.hasOriginal ? <OriginalAvailableTag /> : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
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
                  data.isCommercial ? (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                      {wave.videoUnlockedByViewer && wave.videoUrl ? (
                        <video
                          key={wave.videoUrl}
                          className="aspect-video w-full"
                          controls
                          playsInline
                          preload="metadata"
                          src={wave.videoUrl}
                        />
                      ) : (
                        <WaveSnapshotCarousel
                          urls={
                            wave.snapshotUrls.length > 0
                              ? wave.snapshotUrls
                              : wave.thumbnailUrls
                          }
                        />
                      )}
                      {waveState.surfer ? (
                        <div className="absolute top-3 left-3 z-10">
                          <PostSurferBadge surfer={waveState.surfer} />
                        </div>
                      ) : null}
                      {commercialPostsByJobId.has(wave.jobId) ? (
                        <CommercialWaveActions
                          post={commercialPostsByJobId.get(wave.jobId)!}
                          overlay
                          onClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
                          onPurchased={onUnlockChanged}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                      <video
                        key={wave.videoUrl ?? undefined}
                        className="aspect-video w-full"
                        controls
                        playsInline
                        preload="metadata"
                        src={wave.videoUrl ?? undefined}
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
                  )
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

export function SharedSessionView({
  data: initialData,
  shareToken,
}: {
  data: PublicSharedSession;
  shareToken: string;
}) {
  const { user, isLoading: authLoading } = useUser();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<ViewTab>("feed");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [claimOverrides, setClaimOverrides] = useState<
    Record<string, WaveClaimOverride>
  >({});

  const refreshSession = useCallback(async () => {
    if (!user) return;
    try {
      const next = await fetchAuthenticatedSharedSession(shareToken);
      setData(next);
    } catch {
      /* keep current view */
    }
  }, [user, shareToken]);

  useEffect(() => {
    if (authLoading || !user) return;
    void refreshSession();
  }, [authLoading, user, refreshSession]);
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

  const feedLocation = useMemo(() => sharedSessionToFeedLocation(data.session), [data.session]);
  const feedSession = useMemo(() => sharedSessionToFeedSession(data.session), [data.session]);

  const commercialPosts = useMemo(() => {
    if (!data.isCommercial) return [];
    return data.waves.map((wave) =>
      sharedSessionWaveToDiscoverPost(wave, {
        partnerName,
        partnerAvatarUrl: data.partnerAvatarUrl,
        location: feedLocation,
        feedSession,
      }),
    );
  }, [data.isCommercial, data.waves, data.partnerAvatarUrl, partnerName, feedLocation, feedSession]);

  const commercialPostsByJobId = useMemo(() => {
    const map = new Map<string, DiscoverFeedPost>();
    for (const post of commercialPosts) {
      map.set(post.id, post);
    }
    return map;
  }, [commercialPosts]);

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
        <ShareBackButton />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            {data.partnerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.partnerAvatarUrl}
                alt=""
                className="size-12 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <div
                className="size-12 shrink-0 rounded-full border border-border bg-muted/50"
                aria-hidden
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Shared session</p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {partnerName}
              </h1>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-border bg-transparent text-foreground"
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

        <Card className="border-border bg-card text-foreground">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-medium text-foreground">
                {data.session.sessionDate} · {data.session.sessionTime}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
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
                    className="inline-flex max-w-full items-center truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No wave types</span>
              )}
            </div>
          </CardContent>
        </Card>

        <SharedSessionSurferList surfers={sessionSurfers} />
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {waveCountLabel}
          </h2>
          <div
            className="inline-flex rounded-lg border border-border bg-card p-0.5"
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
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-muted-foreground",
                )}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {waveCount === 0 ? (
          <p className="text-sm text-muted-foreground">No waves in this session yet.</p>
        ) : tab === "feed" && data.isCommercial ? (
          <SharedSessionCommercialFeedTab
            posts={commercialPosts}
            onUnlockChanged={() => void refreshSession()}
          />
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
            onUnlockChanged={() => void refreshSession()}
            commercialPostsByJobId={commercialPostsByJobId}
          />
        )}
      </section>
    </div>
  );
}
