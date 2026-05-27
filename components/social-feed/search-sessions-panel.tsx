"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { englishCountryLabel } from "@/lib/countries";
import {
  fetchSearchSessions,
  parseFeedSearchParams,
  type SearchSessionItem,
} from "@/lib/feed-search";
import { SearchSessionCard } from "@/components/social-feed/search-session-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SEARCH_SESSIONS_PAGE_SIZE = 10;

function searchLocationTitle(params: ReturnType<typeof parseFeedSearchParams>): string {
  if (!params) return "";
  const country = englishCountryLabel(params.countryCode) ?? params.countryCode;
  if (params.spotId) return `Spots in ${country}`;
  if (params.regionId) return `Regions in ${country}`;
  return country;
}

function sessionDateLabel(sessionDate: string | null): string {
  if (!sessionDate) return "All dates";
  try {
    return format(parseISO(sessionDate), "EEEE, MMMM d, yyyy");
  } catch {
    return sessionDate;
  }
}

export function SearchSessionsPanel() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const params = useMemo(
    () => parseFeedSearchParams(searchParams),
    [searchParamsKey, searchParams],
  );

  const [sessions, setSessions] = useState<SearchSessionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      if (!params) {
        return { sessions: [], nextCursor: null, hasMore: false };
      }
      return fetchSearchSessions({
        countryCode: params.countryCode,
        regionId: params.regionId,
        spotId: params.spotId,
        sessionDate: params.sessionDate,
        cursor,
        limit: SEARCH_SESSIONS_PAGE_SIZE,
      });
    },
    [params],
  );

  useEffect(() => {
    if (!params) {
      setSessions([]);
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setSessions([]);
    setNextCursor(null);
    setHasMore(false);
    setError(null);
    setInitialLoading(true);
    fetchPage(null)
      .then((page) => {
        if (requestIdRef.current !== requestId) return;
        setSessions(page.sessions);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((e) => {
        if (requestIdRef.current !== requestId) return;
        setError(e instanceof Error ? e.message : "Failed to load sessions");
        setSessions([]);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setInitialLoading(false);
        }
      });
  }, [fetchPage, params]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage(nextCursor);
      if (requestIdRef.current !== requestId) return;
      setSessions((prev) => {
        const seen = new Set(prev.map((s) => s.sessionId));
        const additions = page.sessions.filter((s) => !seen.has(s.sessionId));
        return [...prev, ...additions];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (e) {
      if (requestIdRef.current !== requestId) return;
      setError(e instanceof Error ? e.message : "Failed to load more sessions");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoadingMore(false);
      }
    }
  }, [fetchPage, loadingMore, nextCursor]);

  if (!params) return null;

  return (
    <div className="space-y-4 px-4 sm:px-0">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchLocationTitle(params)} · {sessionDateLabel(params.sessionDate)}
        </p>
      </div>

      {initialLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="animate-pulse overflow-hidden border-border bg-card"
            >
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="space-y-2">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted/80" />
                </div>
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="size-[4.5rem] rounded-lg bg-muted/80 sm:size-20"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="overflow-hidden border-red-500/20 bg-red-500/5 text-foreground">
          <CardContent className="p-4 text-sm text-red-500 dark:text-red-300">{error}</CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card className="overflow-hidden border-border bg-card text-foreground">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {params.sessionDate
              ? "No published sessions for this location on this day."
              : "No published sessions for this location yet."}
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <SearchSessionCard session={session} />
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => void handleLoadMore()}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
