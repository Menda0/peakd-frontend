import Link from "next/link";
import { format, parseISO } from "date-fns";
import { BadgeDollarSignIcon, PlayCircleIcon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingCardPlaceInfo } from "@/components/landing/landing-card-place-info";
import type { SearchSessionItem } from "@/lib/feed-search";
import { splitLandingPlace } from "@/lib/landing-place-labels";
import { cn } from "@/lib/utils";
import { SIGN_IN_HREF } from "./landing-header";

function formatSessionDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}

function sessionDateLine(session: SearchSessionItem): string {
  return `${formatSessionDate(session.sessionDate)} · ${session.sessionTime}`;
}

function sessionLocationInput(session: SearchSessionItem) {
  return {
    spotName: session.spotName,
    regionName: session.regionName,
    countryCode: session.countryCode,
  };
}

function LatestSessionCard({ session }: { session: SearchSessionItem }) {
  const thumbnail = session.previewThumbnailUrls[0] ?? null;
  const authorName = session.author.displayName?.trim() || "Unknown";
  const videoLabel =
    session.videoCount === 1 ? "1 wave" : `${session.videoCount} waves`;
  const { fullLabel } = splitLandingPlace(sessionLocationInput(session));

  const card = (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-primary/30">
      <div className="relative aspect-video bg-muted">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No preview
          </div>
        )}
        <span
          className={cn(
            "absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full ring-1 ring-card",
            session.isCommercial
              ? "bg-amber-500/90 text-amber-50"
              : "bg-background/90 text-muted-foreground",
          )}
          aria-hidden
        >
          {session.isCommercial ? (
            <BadgeDollarSignIcon className="size-3.5" />
          ) : (
            <PlayCircleIcon className="size-3.5" />
          )}
        </span>
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-border">
          <VideoIcon className="size-3" aria-hidden />
          {videoLabel}
        </span>
      </div>
      <div className="p-4">
        <LandingCardPlaceInfo
          location={sessionLocationInput(session)}
          dateLine={sessionDateLine(session)}
          meta={`by ${authorName}`}
        />
      </div>
    </article>
  );

  if (!session.shareToken) {
    return card;
  }

  return (
    <Link
      href={`/share/sessions/${encodeURIComponent(session.shareToken)}`}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Open session at ${fullLabel}`}
    >
      {card}
    </Link>
  );
}

export function LandingLatestSessions({
  sessions,
}: {
  sessions: SearchSessionItem[];
}) {
  const latestSessions = sessions.slice(0, 4);

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Latest sessions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Recently published surf sessions from partners. Open a session to
            browse waves or sign in to claim yours.
          </p>
        </div>

        {latestSessions.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            No published sessions yet. Check back as partners add new shoots.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latestSessions.map((session) => (
              <LatestSessionCard key={session.sessionId} session={session} />
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-border bg-accent/40 px-6 py-8 text-center sm:px-10">
          <h3 className="text-lg font-semibold text-foreground">
            Ready to find your waves?
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Create an account to claim clips, follow partners, and explore
            sessions at your favorite breaks.
          </p>
          <Button
            nativeButton={false}
            render={<Link href={SIGN_IN_HREF} />}
            size="lg"
            className="mt-5 h-10 px-6"
          >
            Sign in to Peakd
          </Button>
        </div>
      </div>
    </section>
  );
}
