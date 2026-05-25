"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WaveSnapshotCarousel({
  urls,
  className,
}: {
  urls: string[];
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = urls.length > 0 ? urls : [];

  const scrollToIndex = useCallback((next: number) => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    const clamped = ((next % slides.length) + slides.length) % slides.length;
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
    setIndex(clamped);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-secondary/80 text-sm text-muted-foreground",
          className,
        )}
      >
        No previews
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className="flex aspect-video snap-x snap-mandatory overflow-x-auto rounded-2xl border border-border bg-secondary/80 scrollbar-none"
        onScroll={() => {
          const el = scrollRef.current;
          if (!el || slides.length === 0) return;
          const w = el.clientWidth || 1;
          const i = Math.round(el.scrollLeft / w);
          setIndex(Math.min(Math.max(0, i), slides.length - 1));
        }}
      >
        {slides.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="h-full w-full shrink-0 snap-start snap-always"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 left-2 z-10 size-8 -translate-y-1/2 rounded-full border border-border bg-black/60 text-foreground hover:bg-black/80"
            aria-label="Previous image"
            onClick={() => scrollToIndex(index - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-2 z-10 size-8 -translate-y-1/2 rounded-full border border-border bg-black/60 text-foreground hover:bg-black/80"
            aria-label="Next image"
            onClick={() => scrollToIndex(index + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full",
                  i === index ? "bg-primary" : "bg-white/40",
                )}
                aria-hidden
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
