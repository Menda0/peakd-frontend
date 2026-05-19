"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import type { SurferProfile } from "@/lib/surfer-profile";
import { ClaimWaveButton } from "./claim-wave-button";
import { PostActionsBar } from "./post-actions-bar";
import { PostContent } from "./post-content";
import { PostSessionInfo } from "./post-session-info";
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";

function DiscoverVideoPostCard({ post }: { post: DiscoverFeedPost }) {
  const [claimedLocally, setClaimedLocally] = useState(false);
  const [localSurfer, setLocalSurfer] = useState<SurferProfile | null>(null);
  const surfer = post.surfer ?? localSurfer;
  const isProcessing = post.status === "processing";
  const timeLabel = isProcessing ? "Processing…" : post.timeAgo;
  const canClaim =
    post.isPartnerUpload &&
    !isProcessing &&
    post.claimStatus === "none" &&
    !post.claimedByViewer &&
    !claimedLocally;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={post.authorName}
        authorAvatarUrl={post.authorAvatarUrl}
        partnerUpload={post.isPartnerUpload}
        location={post.location}
        timeAgo={timeLabel}
      />
      {isProcessing ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80">
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950">
            <Loader2Icon className="size-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-zinc-400">Your video is being processed</p>
          </div>
        </div>
      ) : (
        <PostMedia
          thumbnailUrl={post.thumbnailUrl}
          videoUrl={post.videoUrl ?? undefined}
          surfer={surfer}
          claimWave={
            canClaim ? (
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
}: {
  post?: DiscoverFeedPost;
  placeholder?: PlaceholderPost;
}) {
  if (post) {
    return <DiscoverVideoPostCard post={post} />;
  }

  if (!placeholder) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={placeholder.authorName}
        location={placeholder.location}
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
