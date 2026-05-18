import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import { PostActionsBar } from "./post-actions-bar";
import { PostContent } from "./post-content";
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
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <PostHeader
          authorName={post.authorName}
          authorAvatarUrl={post.authorAvatarUrl}
          verified={post.verified}
          location={post.location}
          timeAgo={post.timeAgo}
        />
        <PostMedia
          thumbnailUrl={post.thumbnailUrl}
          videoUrl={post.videoUrl}
          title={post.title}
        />
        <PostContent title={post.title} description="" hashtags={[]} />
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
