"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoThumbnailStrip } from "@/components/studio/session-summary-card";
import type { PublicSharedSession } from "@/lib/shared-session";
import { formatDurationMinutes, waveTypeTitle } from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

function ConditionsStars({ rating }: { rating: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">Conditions</span>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={
          rating != null ? `${rating} out of 5 stars` : "Conditions not rated"
        }
      >
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Star
            key={n}
            className={cn(
              "size-3.5 shrink-0",
              rating != null && n <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-zinc-600",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function sessionLocationLabel(data: PublicSharedSession): string {
  const { session } = data;
  if (session.isUndisclosed) {
    return `Undisclosed · ${session.countryCode}`;
  }
  const spot = session.spotName?.trim();
  const parts = [spot, session.regionName, session.countryCode].filter(Boolean);
  return parts.join(" · ");
}

export function SharedSessionView({ data }: { data: PublicSharedSession }) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const waveLabels = data.session.waveTypes.map((id) => waveTypeTitle(id));
  const waveCount = data.waves.length;
  const waveCountLabel =
    waveCount === 1 ? "1 wave" : `${waveCount} waves`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          {data.partnerAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.partnerAvatarUrl}
              alt=""
              className="size-12 shrink-0 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div
              className="size-12 shrink-0 rounded-full border border-white/10 bg-white/5"
              aria-hidden
            />
          )}
          <div>
            <p className="text-sm text-zinc-500">Shared session</p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
              {data.partnerName?.trim() || "Peakd session"}
            </h1>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-medium text-zinc-100">
                {data.session.sessionDate} · {data.session.sessionTime}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {sessionLocationLabel(data)} ·{" "}
                {formatDurationMinutes(data.session.durationMinutes)}
              </p>
            </div>
            <ConditionsStars rating={data.session.conditionsRating} />
            <div className="flex flex-wrap items-center gap-1.5">
              {waveLabels.length > 0 ? (
                waveLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex max-w-full items-center truncate rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-600">No wave types</span>
              )}
            </div>
          </CardContent>
        </Card>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          {waveCountLabel}
        </h2>

        {waveCount === 0 ? (
          <p className="text-sm text-zinc-500">No waves in this session yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.waves.map((wave) => {
              const isActive = activeJobId === wave.jobId;
              return (
                <li key={wave.jobId}>
                  <Card
                    className={cn(
                      "border-white/10 bg-white/[0.03] text-zinc-100",
                      isActive && "ring-1 ring-primary/40",
                    )}
                  >
                    <CardContent className="flex flex-col gap-4 p-4">
                      <button
                        type="button"
                        className="flex min-w-0 flex-col gap-4 text-left transition-opacity hover:opacity-90 sm:flex-row sm:items-center"
                        onClick={() =>
                          setActiveJobId(isActive ? null : wave.jobId)
                        }
                      >
                        <VideoThumbnailStrip
                          urls={wave.thumbnailUrls}
                          emptyLabel="Wave"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                          <span className="truncate font-medium text-zinc-100">
                            {wave.originalFilename}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(wave.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </button>
                      {isActive ? (
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                          <video
                            key={wave.videoUrl}
                            className="aspect-video w-full"
                            controls
                            playsInline
                            preload="metadata"
                            src={wave.videoUrl}
                          />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
