import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import { PostActionsBar } from "./post-actions-bar";
import { PostContent } from "./post-content";
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";

export function VideoPostCard({ post }: { post: PlaceholderPost }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <PostHeader
        authorName={post.authorName}
        verified={post.verified}
        location={post.location}
        timeAgo={post.timeAgo}
      />
      <PostMedia duration={post.duration} />
      <PostContent title={post.title} description={post.description} hashtags={post.hashtags} />
      <PostActionsBar likes={post.likes} comments={post.comments} shares={post.shares} />
    </article>
  );
}
