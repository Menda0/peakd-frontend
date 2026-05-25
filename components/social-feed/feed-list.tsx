import type { DiscoverFeedPost } from "@/lib/discover-feed";
import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import type { SurferProfile } from "@/lib/surfer-profile";
import { VideoPostCard } from "./video-post-card";

export type FeedPost = PlaceholderPost | DiscoverFeedPost;

function isDiscoverPost(post: FeedPost): post is DiscoverFeedPost {
  return "status" in post;
}

export function FeedList({
  posts,
  onCommercialPurchased,
  onCommercialClaimed,
}: {
  posts: FeedPost[];
  onCommercialPurchased?: () => void;
  onCommercialClaimed?: (surfer: SurferProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      {posts.map((post) => (
        <VideoPostCard
          key={post.id}
          post={isDiscoverPost(post) ? post : undefined}
          placeholder={isDiscoverPost(post) ? undefined : post}
          onCommercialPurchased={onCommercialPurchased}
          onCommercialClaimed={onCommercialClaimed}
        />
      ))}
    </div>
  );
}
