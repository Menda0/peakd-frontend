import type { StoryItem } from "@/lib/social-feed-placeholder";
import { DiscoverFeed } from "./discover-feed";
import { FeedToolbar } from "./feed-toolbar";
import { StoriesRow } from "./stories-row";

export function FeedMainColumn({ stories }: { stories: StoryItem[] }) {
  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <StoriesRow stories={stories} />
        <div className="mt-4">
          <FeedToolbar />
        </div>
        <DiscoverFeed />
      </div>
    </main>
  );
}
