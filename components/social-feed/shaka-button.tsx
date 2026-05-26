"use client";

import { useState, useTransition } from "react";
import { ShakaIcon } from "@/components/icons/shaka-icon";
import { shakaVideo, unshakaVideo } from "@/lib/discover-feed";

function shakaCountLabel(n: number) {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

export function ShakaButton({
  jobId,
  initialCount,
  initialShakaed,
  disabled = false,
}: {
  jobId: string;
  initialCount: number;
  initialShakaed: boolean;
  disabled?: boolean;
}) {
  const [shakaed, setShakaed] = useState(initialShakaed);
  const [count, setCount] = useState(initialCount);
  const [lastInitial, setLastInitial] = useState({
    shakaed: initialShakaed,
    count: initialCount,
  });
  const [isPending, startTransition] = useTransition();

  if (
    lastInitial.shakaed !== initialShakaed ||
    lastInitial.count !== initialCount
  ) {
    setLastInitial({ shakaed: initialShakaed, count: initialCount });
    setShakaed(initialShakaed);
    setCount(initialCount);
  }

  const inactive = disabled || jobId.length === 0;

  const onToggle = () => {
    if (inactive || isPending) return;
    const wasShakaed = shakaed;
    const prevCount = count;
    const optimisticCount = wasShakaed
      ? Math.max(0, prevCount - 1)
      : prevCount + 1;
    setShakaed(!wasShakaed);
    setCount(optimisticCount);

    startTransition(() => {
      const op = wasShakaed ? unshakaVideo(jobId) : shakaVideo(jobId);
      op.then(
        (res) => {
          setShakaed(res.shakaedByViewer);
          setCount(res.shakaCount);
        },
        () => {
          setShakaed(wasShakaed);
          setCount(prevCount);
        },
      );
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={inactive}
      aria-pressed={shakaed}
      aria-label={shakaed ? "Remove shaka" : "Give a shaka"}
      className={`flex items-center gap-1.5 transition-colors ${
        shakaed ? "text-primary" : "text-muted-foreground hover:text-primary"
      } ${inactive ? "cursor-default opacity-60" : "cursor-pointer"}`}
    >
      <ShakaIcon
        filled={shakaed}
        className={`size-5 transition-transform ${
          isPending ? "scale-110" : ""
        }`}
      />
      <span className="text-sm tabular-nums">{shakaCountLabel(count)}</span>
    </button>
  );
}
