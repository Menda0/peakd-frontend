"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { BadgeDollarSignIcon, PlayCircleIcon } from "lucide-react";
import {
  fetchLatestSessions,
  type SearchSessionItem,
} from "@/lib/feed-search";
import { englishCountryLabel } from "@/lib/countries";
import { cn } from "@/lib/utils";

const LATEST_SESSIONS_LIMIT = 5;

function formatSessionDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}

function LatestSessionItem({ session }: { session: SearchSessionItem }) {
  const thumbnail = session.previewThumbnailUrls[0] ?? null;
  const placeName = session.spotName ?? session.regionName;
  const country =
    englishCountryLabel(session.countryCode) ?? session.countryCode;
  const authorName = session.author.displayName?.trim() || "Unknown";
  const dateLabel = formatSessionDate(session.sessionDate);

  const body = (
    <div className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/40">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
            No preview
          </div>
        )}
        <span
          className={cn(
            "absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full ring-1 ring-card",
            session.isCommercial
              ? "bg-amber-500/90 text-amber-50"
              : "bg-background/90 text-muted-foreground",
          )}
          aria-hidden
        >
          {session.isCommercial ? (
            <BadgeDollarSignIcon className="size-3" />
          ) : (
            <PlayCircleIcon className="size-3" />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">
          {placeName}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {session.spotName ? `${session.regionName} · ` : ""}
          {country}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {dateLabel} · {session.sessionTime}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          by {authorName}
        </p>
      </div>
    </div>
  );

  if (session.shareToken) {
    return (
      <Link
        href={`/share/sessions/${encodeURIComponent(session.shareToken)}`}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Open session at ${placeName} on ${dateLabel}`}
      >
        {body}
      </Link>
    );
  }
  return body;
}

function SkeletonItem() {
  return (
    <div className="flex animate-pulse items-start gap-3 rounded-lg p-2">
      <div className="size-16 shrink-0 rounded-md bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted/70" />
        <div className="h-3 w-2/3 rounded bg-muted/70" />
      </div>
    </div>
  );
}

export function DiscoverySidebar() {
  const [sessions, setSessions] = useState<SearchSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLatestSessions({ limit: LATEST_SESSIONS_LIMIT })
      .then((items) => {
        if (cancelled) return;
        setSessions(items);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Failed to load latest sessions",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-sidebar-border bg-sidebar py-6 pl-3 pr-3 xl:block">
      <section>
        <h2 className="mb-3 px-2 text-sm font-semibold text-foreground">
          Latest sessions
        </h2>
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: LATEST_SESSIONS_LIMIT }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="px-2 text-xs text-red-500 dark:text-red-300">
            {error}
          </p>
        ) : sessions.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">
            No sessions uploaded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <LatestSessionItem session={session} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
