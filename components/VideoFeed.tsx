"use client";

import { useEffect, useRef, useState } from "react";
import { VideoSlide } from "@/components/VideoSlide";
import { sampleVideos } from "@/lib/sampleVideos";

export function VideoFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeId, setActiveId] = useState(sampleVideos[0]?.id ?? "");

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || sampleVideos.length === 0) return;

    const elements = () =>
      sampleVideos
        .map((v) => slideRefs.current.get(v.id))
        .filter((el): el is HTMLDivElement => Boolean(el));

    let frame = 0;
    const ratios = new Map<Element, number>();

    const pickActive = () => {
      const els = elements();
      if (els.length === 0) return;

      let bestId: string | null = null;
      let bestRatio = 0;
      for (const el of els) {
        const id = el.getAttribute("data-video-id");
        if (!id) continue;
        const r = ratios.get(el) ?? 0;
        if (r > bestRatio) {
          bestRatio = r;
          bestId = id;
        }
      }
      if (bestId !== null && bestRatio >= 0.45) {
        setActiveId((prev) => (prev === bestId ? prev : bestId!));
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(pickActive);
      },
      {
        root,
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      },
    );

    const els = elements();
    for (const el of els) io.observe(el);

    pickActive();

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overflow-x-hidden overscroll-y-contain motion-reduce:snap-none"
    >
      {sampleVideos.map((item) => (
        <VideoSlide
          key={item.id}
          ref={(el) => {
            if (el) slideRefs.current.set(item.id, el);
            else slideRefs.current.delete(item.id);
          }}
          item={item}
          isActive={activeId === item.id}
        />
      ))}
    </div>
  );
}
