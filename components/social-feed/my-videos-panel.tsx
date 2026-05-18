"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2Icon, VideoIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { englishCountryLabel } from "@/lib/countries";
import { PERSONAL_UPLOAD_EVENT } from "@/lib/discover-feed";
import { fetchMyVideos, type MyVideoItem } from "@/lib/my-videos";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

function formatLocation(item: MyVideoItem): string {
  const country = englishCountryLabel(item.location.countryCode) ?? item.location.countryCode;
  if (item.location.isUndisclosed) {
    return `${item.location.regionName}, ${country}`;
  }
  if (item.location.spotName) {
    return `${item.location.spotName}, ${item.location.regionName}`;
  }
  return `${item.location.regionName}, ${country}`;
}

function MyVideoCard({ item }: { item: MyVideoItem }) {
  const isProcessing = item.status === "processing";
  const isFailed = item.status === "failed";
  const timeLabel = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="relative aspect-video w-full bg-zinc-900/80">
        {isProcessing ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950">
            <Loader2Icon className="size-9 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-zinc-400">Processing…</p>
          </div>
        ) : item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <VideoIcon className="size-12" aria-hidden />
          </div>
        )}
        {isFailed ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-950/90 px-2.5 py-1 text-xs font-medium text-red-300">
            Failed
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-4">
        <p className="text-sm font-medium text-zinc-100">
          {item.session.sessionDate} · {item.session.sessionTime}
          <span className="font-normal text-zinc-500">
            {" "}
            · {formatDurationMinutes(item.session.durationMinutes)}
          </span>
        </p>
        <p className="text-xs text-zinc-500">{formatLocation(item)}</p>
        {item.session.waveTypes.length > 0 ? (
          <p className="line-clamp-2 text-xs text-zinc-400">
            {item.session.waveTypes.map((id) => waveTypeTitle(id)).join(" · ")}
          </p>
        ) : null}
        <p className="text-xs text-zinc-600">{isProcessing ? "Processing…" : timeLabel}</p>
        {item.claimStatus === "auto" ? (
          <p className="text-xs font-medium text-primary/90">Auto-claimed</p>
        ) : null}
      </div>
    </article>
  );
}

export function MyVideosPanel() {
  const [videos, setVideos] = useState<MyVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await fetchMyVideos();
      setVideos(items);
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
    const onUpload = () => {
      void load();
    };
    window.addEventListener(PERSONAL_UPLOAD_EVENT, onUpload);
    return () => window.removeEventListener(PERSONAL_UPLOAD_EVENT, onUpload);
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
    return (
      <div className="flex justify-center py-16">
        <Loader2Icon className="size-8 animate-spin text-zinc-500" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-6 text-center text-sm text-red-300">
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
        <p className="text-sm font-medium text-zinc-200">No videos yet</p>
        <p className="mt-2 text-sm text-zinc-500">
          Upload a video from the top bar. Your uploads are auto-claimed and appear here while
          processing.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 pt-2 sm:grid-cols-2")}>
      {videos.map((item) => (
        <MyVideoCard key={item.jobId} item={item} />
      ))}
    </div>
  );
}
