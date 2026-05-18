"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  discoverItemToPost,
  fetchDiscoverFeed,
  type DiscoverFeedPost,
} from "@/lib/discover-feed";
import { FeedList } from "./feed-list";

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-zinc-800" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 rounded bg-zinc-800" />
              <div className="h-3 w-48 rounded bg-zinc-800/80" />
            </div>
          </div>
          <div className="mt-3 aspect-video w-full rounded-2xl bg-zinc-800/80" />
        </div>
      ))}
    </div>
  );
}

export function DiscoverFeed() {
  const [posts, setPosts] = useState<DiscoverFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const appendPage = useCallback(
    (items: DiscoverFeedPost[], nextCursor: string | null, more: boolean) => {
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of items) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
        return merged;
      });
      cursorRef.current = nextCursor;
      setHasMore(more);
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchDiscoverFeed({ limit: 20 });
      const mapped = page.items.map((item) =>
        discoverItemToPost(
          item,
          formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
        ),
      );
      setPosts(mapped);
      cursorRef.current = page.nextCursor;
      setHasMore(page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
      setPosts([]);
      cursorRef.current = null;
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursorRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchDiscoverFeed({
        limit: 20,
        cursor: cursorRef.current,
      });
      const mapped = page.items.map((item) =>
        discoverItemToPost(
          item,
          formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
        ),
      );
      appendPage(mapped, page.nextCursor, page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [appendPage, hasMore]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (loading) {
    return <FeedSkeleton />;
  }

  if (error && posts.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-6 text-center text-sm text-red-300">
        <p>{error}</p>
        <button
          type="button"
          className="mt-3 text-primary underline-offset-2 hover:underline"
          onClick={() => void loadInitial()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
        <p className="text-sm font-medium text-zinc-200">No videos in your feed yet</p>
        <p className="mt-2 text-sm text-zinc-500">
          When partners close sessions or you publish your own videos, they will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <FeedList posts={posts} />
      {error ? <p className="pt-2 text-center text-xs text-red-400">{error}</p> : null}
      <div ref={sentinelRef} className="flex h-12 items-center justify-center py-4">
        {loadingMore ? (
          <Loader2Icon className="size-6 animate-spin text-zinc-500" aria-label="Loading more" />
        ) : null}
      </div>
    </>
  );
}
