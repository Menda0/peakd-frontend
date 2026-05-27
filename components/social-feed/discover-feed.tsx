"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserProfileModal } from "@/components/user-profile/user-profile-provider";
import { englishCountryLabel } from "@/lib/countries";
import {
  discoverItemToPost,
  fetchDiscoverFeed,
  COMMERCIAL_WAVE_UNLOCKED_EVENT,
  PERSONAL_UPLOAD_EVENT,
  type DiscoverFeedPost,
} from "@/lib/discover-feed";
import {
  EMPTY_FEED_FILTERS,
  type FeedFiltersState,
} from "./feed-filters-popover";
import { FeedList } from "./feed-list";
import type { FeedTabId, FeedTabItem } from "./feed-tabs";
import { FeedToolbar } from "./feed-toolbar";

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-0 pt-0 sm:gap-6 sm:pt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse border-b border-border px-4 py-3 sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-5"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted/80" />
            </div>
          </div>
          <div className="-mx-4 aspect-video w-[calc(100%+2rem)] bg-muted/80 sm:mx-0 sm:mt-3 sm:w-full sm:rounded-2xl" />
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

type FeedFilter = {
  countryCode?: string;
  regionId?: string;
  regionIds?: string[];
  spotIds?: string[];
};

function filterForTab(
  tabId: FeedTabId,
  countryCode: string | null,
  homeRegionId: string | null,
  filters: FeedFiltersState,
): FeedFilter {
  if (tabId === "country" && countryCode) {
    const f: FeedFilter = { countryCode };
    if (filters.country.regionIds.length > 0) {
      f.regionIds = filters.country.regionIds;
    }
    if (filters.country.spotIds.length > 0) {
      f.spotIds = filters.country.spotIds;
    }
    return f;
  }
  if (tabId === "region" && countryCode && homeRegionId) {
    const f: FeedFilter = { countryCode, regionId: homeRegionId };
    if (filters.region.spotIds.length > 0) {
      f.spotIds = filters.region.spotIds;
    }
    return f;
  }
  const geo = filters.all.geo;
  if (geo) {
    const f: FeedFilter = { countryCode: geo.countryCode };
    if (geo.regionId) f.regionId = geo.regionId;
    if (geo.spotId) f.spotIds = [geo.spotId];
    return f;
  }
  return {};
}

export function DiscoverFeed() {
  const { profile } = useUserProfileModal();
  const countryCode = profile?.countryCode?.trim() || null;
  const homeRegionId = profile?.homeRegionId?.trim() || null;
  const homeRegionName = profile?.homeRegionName?.trim() || null;
  const countryName = countryCode ? englishCountryLabel(countryCode) : null;

  const tabs = useMemo<FeedTabItem[]>(
    () => [
      { id: "all", label: "All" },
      {
        id: "country",
        label: countryName ?? "My Country",
        disabled: !countryCode,
        disabledHint: "Set your country in your profile to filter by country",
      },
      {
        id: "region",
        label: homeRegionName ?? "My Region",
        disabled: !countryCode || !homeRegionId,
        disabledHint: "Set your home region in your profile to filter by region",
      },
    ],
    [countryCode, countryName, homeRegionId, homeRegionName],
  );

  const [requestedTabId, setRequestedTabId] = useState<FeedTabId>("all");
  const [filters, setFilters] = useState<FeedFiltersState>(EMPTY_FEED_FILTERS);
  const [posts, setPosts] = useState<DiscoverFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const activeTabId: FeedTabId = useMemo(() => {
    const requested = tabs.find((t) => t.id === requestedTabId);
    return requested && !requested.disabled ? requestedTabId : "all";
  }, [tabs, requestedTabId]);

  const filter = useMemo(
    () => filterForTab(activeTabId, countryCode, homeRegionId, filters),
    [activeTabId, countryCode, homeRegionId, filters],
  );

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
      const page = await fetchDiscoverFeed({ limit: 20, ...filter });
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
  }, [filter]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchDiscoverFeed({ limit: 20, ...filter });
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
  }, [filter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursorRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchDiscoverFeed({
        limit: 20,
        cursor: cursorRef.current,
        ...filter,
      });
      const mapped = mapDiscoverPageItems(page.items);
      appendPage(mapped, page.nextCursor, page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [appendPage, filter, hasMore]);

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

  const toolbar = (
    <div className="px-4 pt-4 sm:mt-4 sm:px-0">
      <FeedToolbar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setRequestedTabId}
        filters={filters}
        onFiltersChange={setFilters}
        countryCode={countryCode}
        homeRegionId={homeRegionId}
        homeRegionName={homeRegionName}
      />
    </div>
  );

  if (loading) {
    return (
      <>
        {toolbar}
        <FeedSkeleton />
      </>
    );
  }

  if (error && posts.length === 0) {
    return (
      <>
        {toolbar}
        <div className="mx-4 mt-4 rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-6 text-center text-sm text-red-300 sm:mx-0">
          <p>{error}</p>
          <button
            type="button"
            className="mt-3 text-primary underline-offset-2 hover:underline"
            onClick={() => void loadInitial()}
          >
            Try again
          </button>
        </div>
      </>
    );
  }

  if (posts.length === 0) {
    return (
      <>
        {toolbar}
        <div className="mx-4 mt-4 rounded-2xl border border-border bg-card px-4 py-12 text-center sm:mx-0">
          <p className="text-sm font-medium text-foreground">
            No videos in this feed yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTabId === "all"
              ? "Upload a video from the top bar or browse content from partners in your region."
              : "Try a different tab or check back later."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {toolbar}
      <FeedList
        posts={posts}
        onCommercialPurchased={() => {
          void refreshFirstPage();
        }}
        onCommercialClaimed={() => {
          void refreshFirstPage();
        }}
      />
      {error ? (
        <p className="px-4 pt-2 text-center text-xs text-red-400 sm:px-0">{error}</p>
      ) : null}
      <div
        ref={sentinelRef}
        className="flex h-12 items-center justify-center px-4 py-4 sm:px-0"
      >
        {loadingMore ? (
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-label="Loading more" />
        ) : null}
      </div>
    </>
  );
}
