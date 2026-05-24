"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  discoverItemToPost,
  fetchDiscoverFeed,
  COMMERCIAL_WAVE_UNLOCKED_EVENT,
  PERSONAL_UPLOAD_EVENT,
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

function mapDiscoverPageItems(
  items: Awaited<ReturnType<typeof fetchDiscoverFeed>>["items"],
): DiscoverFeedPost[] {
  return items.map((item) =>
    discoverItemToPost(
      item,
      formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
    ),
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

  const refreshFirstPage = useCallback(async () => {
    try {
      const page = await fetchDiscoverFeed({ limit: 20 });
      const mapped = mapDiscoverPageItems(page.items);
      setPosts((prev) => {
        const firstIds = new Set(mapped.map((p) => p.id));
        const rest = prev.filter((p) => !firstIds.has(p.id));
        return [...mapped, ...rest];
      });
      if (cursorRef.current === null) {
        cursorRef.current = page.nextCursor;
        setHasMore(page.hasMore);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh feed");
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchDiscoverFeed({ limit: 20 });
      const mapped = mapDiscoverPageItems(page.items);
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
      const mapped = mapDiscoverPageItems(page.items);
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
    const onUpload = () => {
      void refreshFirstPage();
    };
    const onCommercialUnlocked = () => {
      void refreshFirstPage();
    };
    window.addEventListener(PERSONAL_UPLOAD_EVENT, onUpload);
    window.addEventListener(COMMERCIAL_WAVE_UNLOCKED_EVENT, onCommercialUnlocked);
    return () => {
      window.removeEventListener(PERSONAL_UPLOAD_EVENT, onUpload);
      window.removeEventListener(COMMERCIAL_WAVE_UNLOCKED_EVENT, onCommercialUnlocked);
    };
  }, [refreshFirstPage]);

  const hasProcessing = posts.some((p) => p.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = window.setInterval(() => {
      void refreshFirstPage();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [hasProcessing, refreshFirstPage]);

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
          Upload a video from the top bar or browse content from partners in your region.
        </p>
      </div>
    );
  }

  return (
    <>
      <FeedList
        posts={posts}
        onCommercialPurchased={() => {
          void refreshFirstPage();
        }}
        onCommercialClaimed={() => {
          void refreshFirstPage();
        }}
      />
      {error ? <p className="pt-2 text-center text-xs text-red-400">{error}</p> : null}
      <div ref={sentinelRef} className="flex h-12 items-center justify-center py-4">
        {loadingMore ? (
          <Loader2Icon className="size-6 animate-spin text-zinc-500" aria-label="Loading more" />
        ) : null}
      </div>
    </>
  );
}
