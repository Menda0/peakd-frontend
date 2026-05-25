"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryItem } from "@/lib/social-feed-placeholder";
import { parseFeedSearchParams } from "@/lib/feed-search";
import { DiscoverFeed } from "./discover-feed";
import { FeedToolbar } from "./feed-toolbar";
import { SearchSessionsPanel } from "./search-sessions-panel";
import { StoriesRow } from "./stories-row";

function FeedMainColumnBody({ stories }: { stories: StoryItem[] }) {
  const searchParams = useSearchParams();
  const activeSearch = parseFeedSearchParams(searchParams);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        {!activeSearch ? (
          <>
            <StoriesRow stories={stories} />
            <div className="mt-4">
              <FeedToolbar />
            </div>
            <DiscoverFeed />
          </>
        ) : (
          <SearchSessionsPanel />
        )}
      </div>
    </main>
  );
}

export function FeedMainColumn({ stories }: { stories: StoryItem[] }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-xl animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-64 rounded-xl bg-white/5" />
          </div>
        </main>
      }
    >
      <FeedMainColumnBody stories={stories} />
    </Suspense>
  );
}
