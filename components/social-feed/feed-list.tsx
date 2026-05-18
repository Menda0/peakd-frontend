import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import { VideoPostCard } from "./video-post-card";

export type FeedPost = PlaceholderPost | DiscoverFeedPost;

function isDiscoverPost(post: FeedPost): post is DiscoverFeedPost {
  return "videoUrl" in post && typeof (post as DiscoverFeedPost).videoUrl === "string";
}

export function FeedList({ posts }: { posts: FeedPost[] }) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      {posts.map((post) => (
        <VideoPostCard
          key={post.id}
          post={isDiscoverPost(post) ? post : undefined}
          placeholder={isDiscoverPost(post) ? undefined : post}
        />
      ))}
    </div>
  );
}
