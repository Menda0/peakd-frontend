import type { PlaceholderPost, StoryItem } from "@/lib/social-feed-placeholder";
import { FeedList } from "./feed-list";
import { FeedToolbar } from "./feed-toolbar";
import { StoriesRow } from "./stories-row";

export function FeedMainColumn({
  stories,
  posts,
}: {
  stories: StoryItem[];
  posts: PlaceholderPost[];
}) {
  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <StoriesRow stories={stories} />
        <div className="mt-4">
          <FeedToolbar />
        </div>
        <FeedList posts={posts} />
      </div>
    </main>
  );
}
