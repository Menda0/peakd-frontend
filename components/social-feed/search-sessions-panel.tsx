"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { englishCountryLabel } from "@/lib/countries";
import {
  fetchSearchSessions,
  parseFeedSearchParams,
  type SearchSessionItem,
} from "@/lib/feed-search";
import { SearchSessionCard } from "@/components/social-feed/search-session-card";
import { Card, CardContent } from "@/components/ui/card";

function searchLocationTitle(params: ReturnType<typeof parseFeedSearchParams>): string {
  if (!params) return "";
  const country = englishCountryLabel(params.countryCode) ?? params.countryCode;
  if (params.spotId) return `Spots in ${country}`;
  if (params.regionId) return `Regions in ${country}`;
  return country;
}

export function SearchSessionsPanel() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const params = useMemo(
    () => parseFeedSearchParams(searchParams),
    [searchParamsKey, searchParams],
  );

  const [sessions, setSessions] = useState<SearchSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params) {
      setSessions([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSearchSessions({
        countryCode: params.countryCode,
        regionId: params.regionId,
        spotId: params.spotId,
        sessionDate: params.sessionDate,
      });
      setSessions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!params) return null;

  let dateLabel = params.sessionDate;
  try {
    dateLabel = format(parseISO(params.sessionDate), "EEEE, MMMM d, yyyy");
  } catch {
    /* keep raw */
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchLocationTitle(params)} · {dateLabel}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="animate-pulse border-border bg-card"
            >
              <CardContent className="h-28 p-4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5 text-foreground">
          <CardContent className="p-4 text-sm text-red-500 dark:text-red-300">{error}</CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card className="border-border bg-card text-foreground">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No published sessions for this location on this day.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.sessionId}>
              <SearchSessionCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
