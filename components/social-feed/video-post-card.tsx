import { Loader2Icon } from "lucide-react";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import { PostActionsBar } from "./post-actions-bar";
import { PostContent } from "./post-content";
import { PostSessionInfo } from "./post-session-info";
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";

export function VideoPostCard({
  post,
  placeholder,
}: {
  post?: DiscoverFeedPost;
  placeholder?: PlaceholderPost;
}) {
  if (post) {
    const isProcessing = post.status === "processing";
    const timeLabel = isProcessing ? "Processing…" : post.timeAgo;

    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <PostHeader
          authorName={post.authorName}
          authorAvatarUrl={post.authorAvatarUrl}
          verified={post.verified}
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
          />
        )}
        <PostSessionInfo session={post.session} />
        {post.claimStatus === "auto" ? (
          <p className="mt-2 text-xs font-medium text-primary/90">Auto-claimed</p>
        ) : null}
        <PostActionsBar likes={post.likes} comments={post.comments} shares={post.shares} />
      </article>
    );
  }

  if (!placeholder) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={placeholder.authorName}
        verified={placeholder.verified}
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
