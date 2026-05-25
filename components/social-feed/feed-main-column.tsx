"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { parseFeedSearchParams } from "@/lib/feed-search";
import { DiscoverFeed } from "./discover-feed";
import { SearchSessionsPanel } from "./search-sessions-panel";

function FeedMainColumnBody() {
  const searchParams = useSearchParams();
  const activeSearch = parseFeedSearchParams(searchParams);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        {!activeSearch ? <DiscoverFeed /> : <SearchSessionsPanel />}
      </div>
    </main>
  );
}

export function FeedMainColumn() {
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
      <FeedMainColumnBody />
    </Suspense>
  );
}
