import type { PlaceholderPost } from "@/lib/social-feed-placeholder";
import { VideoPostCard } from "./video-post-card";

export function FeedList({ posts }: { posts: PlaceholderPost[] }) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      {posts.map((post) => (
        <VideoPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
