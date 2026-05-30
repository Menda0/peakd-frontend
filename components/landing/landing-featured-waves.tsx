"use client";

import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { LandingCardPlaceInfo } from "@/components/landing/landing-card-place-info";
import { PostMedia } from "@/components/social-feed/post-media";
import { englishCountryLabel } from "@/lib/countries";
import type { LandingFeaturedWave } from "@/lib/landing";
import { splitLandingPlace } from "@/lib/landing-place-labels";
import { cn } from "@/lib/utils";

function formatClaimedAt(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

function formatSessionDateLine(sessionDate: string, sessionTime: string): string {
  let dateLabel = sessionDate;
  try {
    dateLabel = format(parseISO(sessionDate), "MMM d, yyyy");
  } catch {
    /* keep raw */
  }
  const time = sessionTime.trim() || "12:00";
  return `${dateLabel} · ${time}`;
}

function FeaturedWaveCard({ wave }: { wave: LandingFeaturedWave }) {
  const surfer = wave.surfer;
  const { fullLabel } = splitLandingPlace(wave.location);
  const claimed = wave.claimedAt
    ? `Claimed ${formatClaimedAt(wave.claimedAt)}`
    : null;
  const surferName = surfer?.displayName?.trim() || null;
  const waveMeta = [claimed, surferName].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <PostMedia
        playbackId={`landing-${wave.jobId}`}
        thumbnailUrl={wave.thumbnailUrl}
        videoUrl={wave.videoUrl ?? undefined}
        title={fullLabel}
        surfer={surfer}
        surferBadgeSize="compact"
        className="aspect-video w-full rounded-none border-0"
      />
      <div className="p-4">
        <LandingCardPlaceInfo
          location={wave.location}
          dateLine={formatSessionDateLine(wave.sessionDate, wave.sessionTime)}
          meta={waveMeta || null}
        />
      </div>
    </article>
  );
}

export function LandingFeaturedWaves({
  waves,
  countryCode,
}: {
  waves: LandingFeaturedWave[];
  countryCode: string | null;
}) {
  const playableWaves = waves.filter((wave) => Boolean(wave.videoUrl));
  const countryName = countryCode ? englishCountryLabel(countryCode) : null;
  const title = countryName
    ? `Recent waves in ${countryName}`
    : "Recent waves";

  if (playableWaves.length === 0) {
    return (
      <section className="border-b border-border px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            No unlocked waves to preview yet. Sign in to explore the discover
            feed as new sessions are published.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Recently claimed, unlocked waves from partner sessions. Hover a
              clip to preview — sign in to claim your own.
            </p>
          </div>
        </div>
        <div
          className={cn(
            "mt-8 grid gap-5",
            playableWaves.length === 1
              ? "max-w-md"
              : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {playableWaves.map((wave) => (
            <FeaturedWaveCard key={wave.jobId} wave={wave} />
          ))}
        </div>
      </div>
    </section>
  );
}
