"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { SessionTagsRow } from "@/components/conditions/session-tags-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommercialWaveActions } from "@/components/social-feed/commercial-wave-actions";
import { feedPostMetaClass } from "@/components/social-feed/feed-post-layout";
import { PostSurferBadge } from "@/components/social-feed/post-surfer-badge";
import { VideoPostCard } from "@/components/social-feed/video-post-card";
import { WaveSnapshotCarousel } from "@/components/social-feed/wave-snapshot-carousel";
import { VideoThumbnailStrip } from "@/components/studio/session-summary-card";
import { ShareBackButton } from "@/components/share/share-back-button";
import { SharedSessionWaveDownloadMenu } from "@/components/share/shared-session-download-menu";
import { SharedSessionSurferList } from "@/components/share/shared-session-surfer-list";
import {
  SharedSessionWaveClaim,
  type SharedSessionWaveClaimState,
} from "@/components/share/shared-session-wave-claim";
import type {
  DiscoverFeedLocation,
  DiscoverFeedPost,
  DiscoverFeedSession,
} from "@/lib/discover-feed";
import type { PublicSharedSession, PublicSharedSessionWave } from "@/lib/shared-session";
import {
  fetchAuthenticatedSharedSession,
  sharedSessionToFeedLocation,
  sharedSessionToFeedSession,
  formatSharedSessionDateLine,
  formatWaveUploadTimeAgo,
  sharedSessionWaveToDiscoverPost,
  sharedSessionZipDownloadPath,
} from "@/lib/shared-session";
import { enrichSharedSessionViewData } from "@/lib/format-datetime";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import type { SurferProfile } from "@/lib/surfer-profile";
import { cn } from "@/lib/utils";

type ViewTab = "feed" | "files";

function sessionLocationLabel(data: PublicSharedSession): string {
  const { session } = data;
  if (session.isUndisclosed) {
    return `Undisclosed · ${session.countryCode}`;
  }
  const spot = session.spotName?.trim();
  const parts = [spot, session.regionName, session.countryCode].filter(Boolean);
  return parts.join(" · ");
}

function OriginalAvailableTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
      Original available
    </span>
  );
}

function SharedSessionWaveFooter({ wave }: { wave: PublicSharedSessionWave }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
      <span
        className="min-w-0 truncate text-xs font-medium text-foreground sm:text-sm"
        title={wave.originalFilename}
      >
        {wave.originalFilename}
      </span>
      {wave.hasOriginal ? <OriginalAvailableTag /> : null}
    </div>
  );
}

function formatWaveListedAt(createdAt: string): string {
  return formatWaveUploadTimeAgo(createdAt);
}

function sharedSessionWavePost(
  wave: PublicSharedSessionWave,
  waveState: SharedSessionWaveClaimState,
  ctx: {
    partnerName: string;
    partnerAvatarUrl: string | null;
    location: DiscoverFeedLocation;
    feedSession: DiscoverFeedSession;
  },
): DiscoverFeedPost {
  const base = sharedSessionWaveToDiscoverPost(wave, {
    partnerName: ctx.partnerName,
    partnerAvatarUrl: ctx.partnerAvatarUrl,
    location: ctx.location,
    feedSession: ctx.feedSession,
  });
  return {
    ...base,
    surfer: waveState.surfer,
    claimStatus: waveState.claimStatus,
    claimedByViewer: wave.claimedByViewer || waveState.claimStatus !== "none",
    canClaim: waveState.canClaim,
    canBuyClaim: waveState.canBuyClaim,
    canSponsor: waveState.canSponsor,
    videoUnlockedByViewer: waveState.videoUnlockedByViewer,
  };
}

function SharedSessionFeedTab({
  data,
  partnerName,
  location,
  feedLocation,
  feedSession,
  resolveWave,
  onWaveClaimed,
  onUnlockChanged,
}: {
  data: PublicSharedSession;
  partnerName: string;
  location: string;
  feedLocation: DiscoverFeedLocation;
  feedSession: DiscoverFeedSession;
  resolveWave: (wave: PublicSharedSessionWave) => SharedSessionWaveClaimState;
  onWaveClaimed: (jobId: string, surfer: SurferProfile) => void;
  onUnlockChanged: () => void;
}) {
  return (
    <div className="flex flex-col gap-0 sm:gap-6">
      {data.waves.map((wave) => {
        const waveState = resolveWave(wave);
        const post = sharedSessionWavePost(wave, waveState, {
          partnerName,
          partnerAvatarUrl: data.partnerAvatarUrl,
          location: feedLocation,
          feedSession,
        });
        return (
          <VideoPostCard
            key={wave.jobId}
            post={post}
            hideActionsBar
            headerActions={<SharedSessionWaveDownloadMenu wave={wave} />}
            footer={<SharedSessionWaveFooter wave={wave} />}
            onCommercialPurchased={onUnlockChanged}
            onCommercialClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
          />
        );
      })}
    </div>
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
  isCommercial,
}: {
  data: PublicSharedSession;
  isCommercial: boolean;
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
    <ul className={cn("flex flex-col gap-3", feedPostMetaClass)}>
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
                <div className="flex min-w-0 items-start gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-3 text-left transition-opacity hover:opacity-90 sm:flex-row sm:items-center sm:gap-4"
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
                        {formatWaveListedAt(wave.createdAt)}
                      </span>
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                    <SharedSessionWaveDownloadMenu wave={wave} />
                    <SharedSessionWaveClaim
                      variant="inline"
                      wave={waveState}
                      partnerName={partnerName}
                      location={location}
                      onClaimed={(surfer) => onWaveClaimed(wave.jobId, surfer)}
                    />
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
      setData(enrichSharedSessionViewData(next));
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
    <div className="mx-auto flex w-full flex-col sm:max-w-xl">
      <header className={cn(feedPostMetaClass, "space-y-4 pb-4 sm:pb-6")}>
        <ShareBackButton />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              {data.partnerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.partnerAvatarUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full border border-border object-cover sm:size-12"
                />
              ) : (
                <div
                  className="size-10 shrink-0 rounded-full border border-border bg-muted/50 sm:size-12"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Shared session
                </p>
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
                  {partnerName}
                </h1>
              </div>
            </div>
            {sessionSurfers.length > 0 ? (
              <SharedSessionSurferList
                surfers={sessionSurfers}
                variant="inline"
              />
            ) : null}
          </div>
          {!data.isCommercial ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 border-border bg-transparent text-foreground sm:w-auto sm:self-end"
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
              <span className="ml-2 text-xs sm:text-sm">
                {zipReady ? "Download session ZIP" : "ZIP preparing…"}
              </span>
            </Button>
          ) : null}
        </div>

        <Card className="border-border bg-card text-foreground sm:shadow-sm">
          <CardContent className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
            <div>
              <p className="text-sm font-medium text-foreground sm:text-base">
                {formatSharedSessionDateLine(data.session)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {sessionLocationLabel(data)} ·{" "}
                {formatDurationMinutes(data.session.durationMinutes)}
              </p>
            </div>
            <SessionTagsRow
              conditionsRating={data.session.conditionsRating}
              waveLabels={waveLabels}
            />
          </CardContent>
        </Card>
      </header>

      <section className="flex flex-col">
        <div
          className={cn(
            feedPostMetaClass,
            "flex flex-col items-center gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6",
          )}
        >
          <h2 className="w-full text-center text-lg font-semibold tracking-tight text-foreground sm:w-auto sm:text-left">
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
          <p className={cn(feedPostMetaClass, "pb-4 text-sm text-muted-foreground sm:pb-0")}>
            No waves in this session yet.
          </p>
        ) : tab === "feed" ? (
          <SharedSessionFeedTab
            data={data}
            partnerName={partnerName}
            location={location}
            feedLocation={feedLocation}
            feedSession={feedSession}
            resolveWave={resolveWave}
            onWaveClaimed={handleWaveClaimed}
            onUnlockChanged={() => void refreshSession()}
          />
        ) : (
          <SharedSessionFilesTab
            data={data}
            isCommercial={data.isCommercial}
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
