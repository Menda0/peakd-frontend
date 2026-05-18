"use client";

import { PlayIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { SurferProfile } from "@/lib/surfer-profile";
import { PostSurferBadge } from "./post-surfer-badge";

export function PostMedia({
  duration,
  thumbnailUrl,
  videoUrl,
  title,
  surfer,
}: {
  duration?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string;
  title?: string;
  surfer?: SurferProfile | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  if (videoUrl) {
    return (
      <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-contain"
          poster={thumbnailUrl ?? undefined}
          src={videoUrl}
          controls={playing}
          playsInline
          preload="metadata"
          aria-label={title ?? "Surf video"}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {!playing ? (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            onClick={() => {
              setPlaying(true);
              void videoRef.current?.play();
            }}
            aria-label="Play video"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <PlayIcon className="size-7 translate-x-0.5 fill-white" aria-hidden />
            </span>
          </button>
        ) : null}
        {surfer ? <PostSurferBadge surfer={surfer} /> : null}
      </div>
    );
  }

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80">
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
