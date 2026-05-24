"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import type { SurferProfile } from "@/lib/surfer-profile";
import { CommercialWaveActions } from "./commercial-wave-actions";
import { ClaimWaveButton } from "./claim-wave-button";
import { PostActionsBar } from "./post-actions-bar";
import { WaveSnapshotCarousel } from "./wave-snapshot-carousel";
import { PostContent } from "./post-content";
import { PostSessionInfo } from "./post-session-info";
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";

function DiscoverVideoPostCard({
  post,
  onCommercialClaimed,
  onCommercialPurchased,
}: {
  post: DiscoverFeedPost;
  onCommercialClaimed?: (surfer: SurferProfile) => void;
  onCommercialPurchased?: () => void;
}) {
  const [claimedLocally, setClaimedLocally] = useState(false);
  const [localSurfer, setLocalSurfer] = useState<SurferProfile | null>(null);
  const surfer = post.surfer ?? localSurfer;
  const isProcessing = post.status === "processing";
  const isFailed = post.status === "failed";
  const timeLabel = isProcessing ? "Processing…" : post.timeAgo;
  const canClaim =
    !post.isCommercial &&
    post.isPartnerUpload &&
    !isProcessing &&
    !isFailed &&
    post.claimStatus === "none" &&
    !post.claimedByViewer &&
    !claimedLocally;
  const showCommercial =
    post.isCommercial && !isProcessing && !isFailed;
  const canPlayVideo =
    !isProcessing &&
    !isFailed &&
    Boolean(post.videoUrl) &&
    (!post.isCommercial || post.videoUnlockedByViewer);
  const commercialLocked = showCommercial && !canPlayVideo;
  const snapshotUrls =
    post.snapshotUrls.length > 0
      ? post.snapshotUrls
      : post.thumbnailUrl
        ? [post.thumbnailUrl]
        : [];

  return (
    <article className="rounded-2xl border border-border bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={post.authorName}
        authorAvatarUrl={post.authorAvatarUrl}
        partnerUpload={post.isPartnerUpload}
        timeAgo={timeLabel}
      />
      {isProcessing ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-secondary/80">
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950">
            <Loader2Icon className="size-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Your video is being processed</p>
          </div>
        </div>
      ) : isFailed ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-red-500/20 bg-secondary/80">
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-red-950/20 via-zinc-900 to-zinc-950 px-4 text-center">
            <p className="text-sm font-medium text-red-300">Upload failed</p>
            <p className="text-xs text-muted-foreground">This video could not be processed.</p>
          </div>
        </div>
      ) : canPlayVideo ? (
        <PostMedia
          thumbnailUrl={post.thumbnailUrl}
          videoUrl={post.videoUrl ?? undefined}
          surfer={surfer}
          playbackId={post.id}
          autoPlayInView
          className="mt-3"
          claimWave={
            !post.isCommercial && canClaim ? (
              <ClaimWaveButton
                variant="overlay"
                jobId={post.id}
                partnerName={post.authorName}
                location={post.location}
                isOwnUpload={post.isOwnUpload}
                onClaimed={(claimedSurfer) => {
                  setClaimedLocally(true);
                  setLocalSurfer(claimedSurfer);
                }}
              />
            ) : undefined
          }
        />
      ) : commercialLocked ? (
        <div className="relative mt-3">
          <WaveSnapshotCarousel urls={snapshotUrls} />
          <CommercialWaveActions
            post={post}
            overlay
            onClaimed={(claimedSurfer) => {
              setClaimedLocally(true);
              setLocalSurfer(claimedSurfer);
              onCommercialClaimed?.(claimedSurfer);
            }}
            onPurchased={() => {
              onCommercialPurchased?.();
            }}
          />
        </div>
      ) : (
        <PostMedia
          thumbnailUrl={post.thumbnailUrl}
          videoUrl={post.videoUrl ?? undefined}
          surfer={surfer}
          playbackId={post.id}
          autoPlayInView
          className="mt-3"
        />
      )}
      <PostSessionInfo sessionSummary={post.sessionSummary} session={post.session} />
      <PostActionsBar likes={post.likes} comments={post.comments} shares={post.shares} />
    </article>
  );
}

export function VideoPostCard({
  post,
  placeholder,
  onCommercialClaimed,
  onCommercialPurchased,
}: {
  post?: DiscoverFeedPost;
  placeholder?: PlaceholderPost;
  onCommercialClaimed?: (surfer: SurferProfile) => void;
  onCommercialPurchased?: () => void;
}) {
  if (post) {
    return (
      <DiscoverVideoPostCard
        post={post}
        onCommercialClaimed={onCommercialClaimed}
        onCommercialPurchased={onCommercialPurchased}
      />
    );
  }

  if (!placeholder) return null;

  return (
    <article className="rounded-2xl border border-border bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={placeholder.authorName}
        timeAgo={placeholder.timeAgo}
      />
      <PostMedia duration={placeholder.duration} />
      <PostContent
        title={placeholder.title}
        description={placeholder.description}
        hashtags={placeholder.hashtags}
      />
      <PostActionsBar
        likes={placeholder.likes}
        comments={placeholder.comments}
        shares={placeholder.shares}
      />
    </article>
  );
}
