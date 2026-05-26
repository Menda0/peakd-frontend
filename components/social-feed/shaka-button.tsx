"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { ShakaIcon } from "@/components/icons/shaka-icon";
import { shakaVideo, unshakaVideo } from "@/lib/discover-feed";

function shakaCountLabel(n: number) {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

type Particle = {
  id: number;
  style: CSSProperties;
};

const PARTICLE_COUNT = 7;
const PARTICLE_LIFETIME_MS = 950;

function buildParticles(idBase: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
    const distance = 40 + Math.random() * 35;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const rotate = -30 + Math.random() * 60;
    const scale = 0.7 + Math.random() * 0.7;
    const delay = Math.random() * 80;
    return {
      id: idBase + i,
      style: {
        "--shaka-x": `${x.toFixed(1)}px`,
        "--shaka-y": `${y.toFixed(1)}px`,
        "--shaka-rotate": `${rotate.toFixed(1)}deg`,
        "--shaka-scale": scale.toFixed(2),
        animationDelay: `${delay}ms`,
      } as CSSProperties,
    };
  });
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextParticleId = useRef(0);

  if (
    lastInitial.shakaed !== initialShakaed ||
    lastInitial.count !== initialCount
  ) {
    setLastInitial({ shakaed: initialShakaed, count: initialCount });
    setShakaed(initialShakaed);
    setCount(initialCount);
  }

  const inactive = disabled || jobId.length === 0;

  const spawnParticles = useCallback(() => {
    const idBase = nextParticleId.current;
    nextParticleId.current += PARTICLE_COUNT;
    const burst = buildParticles(idBase);
    setParticles((prev) => [...prev, ...burst]);
    window.setTimeout(() => {
      const ids = new Set(burst.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, PARTICLE_LIFETIME_MS + 100);
  }, []);

  const onToggle = () => {
    if (inactive || isPending) return;
    const wasShakaed = shakaed;
    const prevCount = count;
    const optimisticCount = wasShakaed
      ? Math.max(0, prevCount - 1)
      : prevCount + 1;
    setShakaed(!wasShakaed);
    setCount(optimisticCount);
    if (!wasShakaed) {
      spawnParticles();
    }

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
      className={`relative flex items-center gap-1.5 transition-colors ${
        shakaed ? "text-primary" : "text-muted-foreground hover:text-primary"
      } ${inactive ? "cursor-default opacity-60" : "cursor-pointer"}`}
    >
      <span className="relative">
        <ShakaIcon
          filled={shakaed}
          className={`size-5 transition-transform ${
            isPending ? "scale-110" : ""
          }`}
        />
        {particles.length > 0 ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            {particles.map((p) => (
              <ShakaIcon
                key={p.id}
                filled
                className="shaka-particle size-5 text-primary"
                style={p.style}
              />
            ))}
          </span>
        ) : null}
      </span>
      <span className="text-sm tabular-nums">{shakaCountLabel(count)}</span>
    </button>
  );
}
