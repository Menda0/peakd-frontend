"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import type { SampleVideo } from "@/lib/sampleVideos";

export type VideoSlideProps = {
  item: SampleVideo;
  isActive: boolean;
} & ComponentPropsWithoutRef<"div">;

export const VideoSlide = forwardRef<HTMLDivElement, VideoSlideProps>(
  function VideoSlide({ item, isActive, className = "", ...rest }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isActive) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, [isActive]);

    return (
      <div
        ref={ref}
        data-video-id={item.id}
        className={`relative h-full w-full shrink-0 snap-start bg-black ${className}`}
        {...rest}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={item.src}
          muted
          playsInline
          loop
          preload="metadata"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-row items-end justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
          <div className="min-w-0 flex-1 text-white drop-shadow-sm">
            <p className="font-semibold leading-tight">{item.username}</p>
            <p className="text-sm text-white/90">@{item.handle}</p>
            <p className="mt-2 line-clamp-3 text-sm text-white/95">
              {item.caption}
            </p>
          </div>

          <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-5 text-white">
            <ActionButton label="Like">
              <HeartIcon />
              <span className="mt-1 text-xs font-medium tabular-nums">
                {item.likes}
              </span>
            </ActionButton>
            <ActionButton label="Comments">
              <ChatIcon />
              <span className="mt-1 text-xs font-medium">Chat</span>
            </ActionButton>
            <ActionButton label="Share">
              <ShareIcon />
              <span className="mt-1 text-xs font-medium">Share</span>
            </ActionButton>
          </div>
        </div>
      </div>
    );
  },
);

function ActionButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 active:opacity-75"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-8 drop-shadow"
      aria-hidden
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-7 drop-shadow"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.323.39.39 0 00-.297.408c0 .065.012.13.036.192a2.28 2.28 0 01-.213 1.938 2.14 2.14 0 00-.165 1.876l.792 2.348a.75.75 0 01-.292.946 2.16 2.16 0 01-1.141.052 51.424 51.424 0 01-4.623-2.458.75.75 0 01-.416-.832l.224-.897a2.16 2.16 0 00-.054-1.352 2.141 2.141 0 01-.156-.838v-.323c0-.672.278-1.315.77-1.775a47.358 47.358 0 001.433-1.49 39.107 39.107 0 00-.833 5.19c-.096 1.718-.552 3.298-1.264 4.649-.884 1.692-2.184 2.912-3.657 3.543a4.467 4.467 0 01-2.06.465 4.477 4.477 0 01-2.101-.503 7.044 7.044 0 01-2.617-2.235c-.746-.997-1.218-2.17-1.402-3.437l-.048-.358c-.134-.996-.282-1.948-.486-2.848-.212-.927-.478-1.806-.798-2.628a29.004 29.004 0 01-6.024-2.090 3.052 3.052 0 01-.148-.884 3.052 3.052 0 01.148-.884z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="size-7 drop-shadow"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
      />
    </svg>
  );
}
