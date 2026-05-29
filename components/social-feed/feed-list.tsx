import type { ReactNode } from "react";
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
  hideActionsBar,
  onCommercialPurchased,
  onCommercialClaimed,
  getHeaderActions,
}: {
  posts: FeedPost[];
  hideActionsBar?: boolean;
  onCommercialPurchased?: () => void;
  onCommercialClaimed?: (surfer: SurferProfile) => void;
  getHeaderActions?: (post: DiscoverFeedPost) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0 pt-0 sm:gap-6 sm:pt-4">
      {posts.map((post) => (
        <VideoPostCard
          key={isDiscoverPost(post) ? post.id : `placeholder-${post.authorName}`}
          post={isDiscoverPost(post) ? post : undefined}
          placeholder={isDiscoverPost(post) ? undefined : post}
          hideActionsBar={hideActionsBar}
          onCommercialPurchased={onCommercialPurchased}
          onCommercialClaimed={onCommercialClaimed}
          headerActions={
            isDiscoverPost(post) && getHeaderActions
              ? getHeaderActions(post)
              : undefined
          }
        />
      ))}
    </div>
  );
}
