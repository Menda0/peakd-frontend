"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { FeedGeoSearchInput } from "@/components/social-feed/feed-geo-search-input";
import { SearchSessionCalendar } from "@/components/social-feed/search-session-calendar";
import {
  buildFeedSearchQueryString,
  fetchSearchSessionDates,
  formatTodayYmd,
  parseFeedSearchParams,
  resolveGeoFromUrlParams,
  type GeoSearchSelection,
} from "@/lib/feed-search";
import { cn } from "@/lib/utils";

export function FeedSearchBar({ homeHref }: { homeHref: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const urlSearch = useMemo(
    () => parseFeedSearchParams(searchParams),
    [searchParamsKey, searchParams],
  );

  const [geo, setGeo] = useState<GeoSearchSelection | null>(null);
  const [sessionDate, setSessionDate] = useState(formatTodayYmd());
  const [datesWithSessions, setDatesWithSessions] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );

  useEffect(() => {
    if (!urlSearch) {
      setGeo(null);
      setSessionDate(formatTodayYmd());
      return;
    }
    setSessionDate(urlSearch.sessionDate);
    setVisibleMonth(urlSearch.sessionDate.slice(0, 7));
    let cancelled = false;
    void resolveGeoFromUrlParams(urlSearch).then((selection) => {
      if (!cancelled) setGeo(selection);
    });
    return () => {
      cancelled = true;
    };
  }, [searchParamsKey, urlSearch]);

  const applySearch = useCallback(
    (nextGeo: GeoSearchSelection, nextDate: string) => {
      const qs = buildFeedSearchQueryString(nextGeo, nextDate);
      router.push(`${homeHref}?${qs}`);
    },
    [homeHref, router],
  );

  const handleGeoChange = useCallback(
    (next: GeoSearchSelection | null) => {
      setGeo(next);
      if (next) {
        const date = sessionDate || formatTodayYmd();
        applySearch(next, date);
      } else {
        router.push(homeHref);
      }
    },
    [applySearch, homeHref, router, sessionDate],
  );

  const handleDateChange = useCallback(
    (ymd: string) => {
      setSessionDate(ymd);
      setVisibleMonth(ymd.slice(0, 7));
      if (geo) {
        applySearch(geo, ymd);
      }
    },
    [applySearch, geo],
  );

  const loadSessionDates = useCallback(
    async (monthYm: string, selection: GeoSearchSelection) => {
      try {
        const dates = await fetchSearchSessionDates({
          countryCode: selection.countryCode,
          regionId: selection.regionId ?? null,
          spotId: selection.spotId ?? null,
          month: monthYm,
        });
        setDatesWithSessions(new Set(dates));
      } catch {
        setDatesWithSessions(new Set());
      }
    },
    [],
  );

  useEffect(() => {
    if (!geo) {
      setDatesWithSessions(new Set());
      return;
    }
    void loadSessionDates(visibleMonth, geo);
  }, [geo, visibleMonth, loadSessionDates]);

  const geoSelected = geo != null;

  const defaultDateForCalendar = useMemo(() => {
    if (urlSearch?.sessionDate) return urlSearch.sessionDate;
    return sessionDate;
  }, [sessionDate, urlSearch?.sessionDate]);

  return (
    <div className="flex w-full max-w-md min-w-0 items-center gap-2 sm:max-w-xl lg:max-w-2xl">
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <FeedGeoSearchInput
          value={geo}
          onValueChange={handleGeoChange}
          className={cn("w-full pl-11")}
        />
      </div>
      <SearchSessionCalendar
        valueYmd={defaultDateForCalendar}
        onChangeYmd={handleDateChange}
        datesWithSessions={datesWithSessions}
        disabled={!geoSelected}
        onMonthChange={setVisibleMonth}
      />
    </div>
  );
}
