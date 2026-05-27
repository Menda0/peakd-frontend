"use client";

import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import { WAVE_CLAIMED_EVENT } from "@/lib/claim-wave";
import {
  COMMERCIAL_WAVE_UNLOCKED_EVENT,
  PERSONAL_UPLOAD_EVENT,
} from "@/lib/discover-feed";
import { fetchMyVideos, myVideoItemToPost } from "@/lib/my-videos";
import { FeedList } from "./feed-list";

function MyVideosSkeleton() {
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

export function MyVideosPanel() {
  const [videos, setVideos] = useState<DiscoverFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await fetchMyVideos();
      setVideos(
        items.map((item) =>
          myVideoItemToPost(
            item,
            formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
          ),
        ),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener(PERSONAL_UPLOAD_EVENT, refresh);
    window.addEventListener(WAVE_CLAIMED_EVENT, refresh);
    window.addEventListener(COMMERCIAL_WAVE_UNLOCKED_EVENT, refresh);
    return () => {
      window.removeEventListener(PERSONAL_UPLOAD_EVENT, refresh);
      window.removeEventListener(WAVE_CLAIMED_EVENT, refresh);
      window.removeEventListener(COMMERCIAL_WAVE_UNLOCKED_EVENT, refresh);
    };
  }, [load]);

  const hasProcessing = videos.some((v) => v.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = window.setInterval(() => {
      void load();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [hasProcessing, load]);

  if (loading) {
    return <MyVideosSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-6 text-center text-sm text-red-300 sm:mx-0 sm:mt-0">
        <p>{error}</p>
        <button
          type="button"
          className="mt-3 text-primary underline-offset-2 hover:underline"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card px-4 py-12 text-center sm:mx-0 sm:mt-0">
        <p className="text-sm font-medium text-foreground">No videos yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a video from the top bar, or claim a partner upload from your feed. Personal
          uploads are auto-claimed and appear here while processing.
        </p>
      </div>
    );
  }

  return <FeedList posts={videos} />;
}
