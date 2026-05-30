"use client";

import { useEffect, useRef } from "react";

export function LandingHeroBackgroundVideo({
  videoUrl,
  thumbnailUrl,
}: {
  videoUrl: string;
  thumbnailUrl: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const play = () => {
      void video.play().catch(() => {
        /* autoplay may be blocked until interaction */
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      play();
    } else {
      video.addEventListener("loadeddata", play, { once: true });
    }

    return () => video.removeEventListener("loadeddata", play);
  }, [videoUrl]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={thumbnailUrl ?? undefined}
        className="h-full w-full scale-105 object-cover"
      >
        <source src={videoUrl} type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/45 to-background/80" />
    </div>
  );
}
