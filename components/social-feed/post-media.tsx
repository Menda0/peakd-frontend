"use client";

import { PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import type { ReactNode } from "react";
import type { SurferProfile } from "@/lib/surfer-profile";
import {
  forceActiveFeedVideo,
  getActiveFeedVideoId,
  registerFeedVideo,
  seekActiveFeedVideo,
  unregisterFeedVideo,
} from "@/lib/feed-video-controller";
import { cn } from "@/lib/utils";
import { PostSurferBadge } from "./post-surfer-badge";

export function PostMedia({
  duration,
  thumbnailUrl,
  videoUrl,
  title,
  surfer,
  claimWave,
  className,
  playbackId: playbackIdProp,
  autoPlayInView = false,
}: {
  duration?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string;
  title?: string;
  surfer?: SurferProfile | null;
  claimWave?: ReactNode;
  className?: string;
  playbackId?: string;
  autoPlayInView?: boolean;
}) {
  const fallbackId = useId();
  const playbackId = playbackIdProp ?? fallbackId;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioOnRef = useRef(false);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !audioOnRef.current;
    void video.play().catch(() => {});
  }, []);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
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
    if (!container) return;

    registerFeedVideo({
      id: playbackId,
      el: container,
      play: () => {
        if (!userPausedRef.current) {
          playVideo();
        }
      },
      pause: () => {
        pauseVideo();
        userPausedRef.current = false;
        audioOnRef.current = false;
        setAudioOn(false);
        const video = videoRef.current;
        if (video) video.muted = true;
      },
      isUserPaused: () => userPausedRef.current,
      onActiveChange: setIsActive,
    });

    return () => {
      unregisterFeedVideo(playbackId);
      setIsActive(false);
    };
  }, [autoPlayInView, videoUrl, playbackId, playVideo, pauseVideo]);

  useEffect(() => {
    if (!autoPlayInView || !isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (getActiveFeedVideoId() !== playbackId) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekActiveFeedVideo("back");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekActiveFeedVideo("forward");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [autoPlayInView, isActive, playbackId]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      if (autoPlayInView) {
        forceActiveFeedVideo(playbackId);
      } else {
        playVideo();
      }
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }, [autoPlayInView, playbackId, playVideo]);

  const onContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    togglePlayPause();
  };

  const onContainerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      seekActiveFeedVideo("back");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      seekActiveFeedVideo("forward");
    }
  };

  const toggleAudio = (e: MouseEvent) => {
    e.stopPropagation();
    setAudioOn((prev) => {
      const next = !prev;
      const video = videoRef.current;
      if (video) {
        video.muted = !next;
        if (next && video.paused && !userPausedRef.current) {
          void video.play().catch(() => {});
        }
      }
      return next;
    });
  };

  if (videoUrl) {
    return (
      <div
        ref={containerRef}
        role="group"
        tabIndex={0}
        aria-label={title ?? "Surf video"}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-secondary/80 outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          className,
        )}
        onClick={onContainerClick}
        onKeyDown={onContainerKeyDown}
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <PlayIcon className="size-7 translate-x-0.5 fill-white" aria-hidden />
            </span>
          </div>
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
        {surfer ? (
          <PostSurferBadge surfer={surfer} />
        ) : claimWave ? (
          claimWave
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-secondary/80",
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
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 font-mono text-xs text-foreground">
          {duration}
        </span>
      ) : null}
    </div>
  );
}
