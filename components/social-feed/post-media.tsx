"use client";

import { PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  releaseFeedVideoPlay,
  requestFeedVideoPlay,
} from "@/lib/feed-video-controller";
import { cn } from "@/lib/utils";
import { PostSurferBadge } from "./post-surfer-badge";

const IN_VIEW_RATIO = 0.55;

export function PostMedia({
  duration,
  thumbnailUrl,
  videoUrl,
  title,
  surfer,
  className,
  playbackId: playbackIdProp,
  autoPlayInView = false,
}: {
  duration?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string;
  title?: string;
  surfer?: SurferProfile | null;
  className?: string;
  playbackId?: string;
  autoPlayInView?: boolean;
}) {
  const fallbackId = useId();
  const playbackId = playbackIdProp ?? fallbackId;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioOnRef = useRef(false);
  const [manualPlaying, setManualPlaying] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [inView, setInView] = useState(false);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setManualPlaying(false);
  }, []);

  useEffect(() => {
    audioOnRef.current = audioOn;
    const video = videoRef.current;
    if (video) {
      video.muted = !audioOn;
    }
  }, [audioOn]);

  useEffect(() => {
    if (!autoPlayInView || !videoUrl) return;

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const visible =
          entry.isIntersecting && entry.intersectionRatio >= IN_VIEW_RATIO;
        setInView(visible);

        if (visible) {
          requestFeedVideoPlay(playbackId, pauseVideo);
          video.muted = !audioOnRef.current;
          void video.play().catch(() => {});
        } else {
          video.pause();
          video.muted = true;
          audioOnRef.current = false;
          setAudioOn(false);
          releaseFeedVideoPlay(playbackId);
        }
      },
      { threshold: [0, IN_VIEW_RATIO, 1] },
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      releaseFeedVideoPlay(playbackId);
    };
  }, [autoPlayInView, videoUrl, playbackId, pauseVideo]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioOn((prev) => {
      const next = !prev;
      const video = videoRef.current;
      if (video) {
        video.muted = !next;
        if (next && (inView || manualPlaying)) {
          void video.play().catch(() => {});
        }
      }
      return next;
    });
  };

  const toggleManualPlay = () => {
    if (autoPlayInView) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = !audioOnRef.current;
      void video.play().then(() => setManualPlaying(true));
    } else {
      video.pause();
      setManualPlaying(false);
    }
  };

  if (videoUrl) {
    const showManualPlayOverlay = !autoPlayInView && !manualPlaying;

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80",
          className,
        )}
      >
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-contain"
          poster={thumbnailUrl ?? undefined}
          src={videoUrl}
          playsInline
          loop
          muted
          preload="metadata"
          aria-label={title ?? "Surf video"}
          onPlay={() => {
            if (!autoPlayInView) setManualPlaying(true);
          }}
          onPause={() => {
            if (!autoPlayInView) setManualPlaying(false);
          }}
        />
        {showManualPlayOverlay ? (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            onClick={toggleManualPlay}
            aria-label="Play video"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <PlayIcon className="size-7 translate-x-0.5 fill-white" aria-hidden />
            </span>
          </button>
        ) : null}
        <button
          type="button"
          className="absolute bottom-3 left-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
          onClick={toggleAudio}
          aria-label={audioOn ? "Mute video" : "Unmute video"}
        >
          {audioOn ? (
            <Volume2Icon className="size-4" aria-hidden />
          ) : (
            <VolumeXIcon className="size-4" aria-hidden />
          )}
        </button>
        {surfer ? <PostSurferBadge surfer={surfer} /> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80",
        className,
      )}
    >
      <div className="aspect-video w-full bg-gradient-to-br from-cyan-950/50 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
          <PlayIcon className="size-7 translate-x-0.5 fill-white" aria-hidden />
        </span>
      </div>
      {duration ? (
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 font-mono text-xs text-zinc-100">
          {duration}
        </span>
      ) : null}
    </div>
  );
}
