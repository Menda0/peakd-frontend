import { getApiBase } from "@/lib/api";
import {
  englishCountryLabel,
  getEnglishCountryOptions,
  type CountryOption,
} from "@/lib/countries";
import { filterGeoByQuery } from "@/lib/geo-picker-utils";

export type GeoSuggestType = "country" | "region" | "spot";

export type GeoSearchSelection = {
  type: GeoSuggestType;
  countryCode: string;
  regionId?: string;
  spotId?: string;
  label: string;
  name: string;
  verified: boolean;
};

export type SearchSessionAuthor = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPartner: boolean;
};

export type SearchSessionItem = {
  sessionId: string;
  countryCode: string;
  regionId: string;
  spotId: string;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: string[];
  regionName: string;
  spotName: string | null;
  author: SearchSessionAuthor;
  videoCount: number;
  previewThumbnailUrls: string[];
};

export function buildGeoSearchLabel(item: GeoSearchSelection): string {
  if (item.type === "country") {
    return englishCountryLabel(item.countryCode) ?? item.countryCode;
  }
  if (item.type === "region") {
    const country = englishCountryLabel(item.countryCode);
    return country ? `${item.name} · ${country}` : item.name;
  }
  return item.label.includes(" · ")
    ? item.label.replace(
        new RegExp(` · ${item.countryCode}$`),
        ` · ${englishCountryLabel(item.countryCode) ?? item.countryCode}`,
      )
    : item.label;
}

export function countryOptionToSelection(option: CountryOption): GeoSearchSelection {
  return {
    type: "country",
    countryCode: option.value,
    label: option.label,
    name: option.label,
    verified: true,
  };
}

export function filterCountrySuggestions(query: string): CountryOption[] {
  const items = getEnglishCountryOptions().map((c) => ({
    ...c,
    name: c.label,
  }));
  return filterGeoByQuery(items, query).slice(0, 6);
}

function normalizeGeoSuggestItem(raw: unknown): GeoSearchSelection | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const type = o.type;
  if (type !== "country" && type !== "region" && type !== "spot") return null;
  const countryCode =
    typeof o.countryCode === "string" ? o.countryCode.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(countryCode)) return null;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;
  const label = typeof o.label === "string" ? o.label.trim() : name;
  const regionId =
    typeof o.regionId === "string" && o.regionId.trim() ? o.regionId.trim() : undefined;
  const spotId =
    typeof o.spotId === "string" && o.spotId.trim() ? o.spotId.trim() : undefined;
  return {
    type,
    countryCode,
    regionId,
    spotId,
    label,
    name,
    verified: o.verified === true,
  };
}

function normalizeSearchSession(raw: unknown): SearchSessionItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const sessionId = typeof o.sessionId === "string" ? o.sessionId.trim() : "";
  if (!sessionId) return null;
  const countryCode =
    typeof o.countryCode === "string" ? o.countryCode.trim().toUpperCase() : "";
  const regionId = typeof o.regionId === "string" ? o.regionId.trim() : "";
  const spotId = typeof o.spotId === "string" ? o.spotId.trim() : "";
  const sessionDate =
    typeof o.sessionDate === "string" ? o.sessionDate.trim() : "";
  const sessionTime =
    typeof o.sessionTime === "string" ? o.sessionTime.trim() : "12:00";
  const durationMinutes =
    typeof o.durationMinutes === "number" && o.durationMinutes >= 15
      ? o.durationMinutes
      : 120;
  const conditionsRating =
    typeof o.conditionsRating === "number" &&
    Number.isInteger(o.conditionsRating) &&
    o.conditionsRating >= 1 &&
    o.conditionsRating <= 5
      ? o.conditionsRating
      : null;
  const waveTypes = Array.isArray(o.waveTypes)
    ? o.waveTypes.filter((w): w is string => typeof w === "string")
    : [];
  const regionName =
    typeof o.regionName === "string" ? o.regionName.trim() : "Unknown";
  const spotName =
    typeof o.spotName === "string" && o.spotName.trim()
      ? o.spotName.trim()
      : null;
  const videoCount =
    typeof o.videoCount === "number" && o.videoCount >= 0 ? o.videoCount : 0;
  const previewThumbnailUrls = Array.isArray(o.previewThumbnailUrls)
    ? o.previewThumbnailUrls.filter((u): u is string => typeof u === "string")
    : [];

  const authorRaw = o.author;
  if (!authorRaw || typeof authorRaw !== "object") return null;
  const a = authorRaw as Record<string, unknown>;
  const userId = typeof a.userId === "string" ? a.userId.trim() : "";
  if (!userId) return null;

  return {
    sessionId,
    countryCode,
    regionId,
    spotId,
    sessionDate,
    sessionTime,
    durationMinutes,
    conditionsRating,
    waveTypes,
    regionName,
    spotName,
    author: {
      userId,
      displayName:
        typeof a.displayName === "string" ? a.displayName.trim() || null : null,
      avatarUrl:
        typeof a.avatarUrl === "string" ? a.avatarUrl.trim() || null : null,
      isPartner: a.isPartner === true,
    },
    videoCount,
    previewThumbnailUrls,
  };
}

export async function fetchGeoSuggest(q: string): Promise<GeoSearchSelection[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const base = getApiBase();
  const params = new URLSearchParams({ q: trimmed, limit: "12" });
  const res = await fetch(`${base}/feed/search/geo-suggest?${params}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = (await res.json()) as { items?: unknown[] };
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map(normalizeGeoSuggestItem)
    .filter((item): item is GeoSearchSelection => item != null);
}

export async function fetchSearchSessionDates(options: {
  countryCode: string;
  regionId?: string | null;
  spotId?: string | null;
  month: string;
}): Promise<string[]> {
  const params = new URLSearchParams({
    countryCode: options.countryCode,
    month: options.month,
  });
  if (options.regionId?.trim()) params.set("regionId", options.regionId.trim());
  if (options.spotId?.trim()) params.set("spotId", options.spotId.trim());
  const base = getApiBase();
  const res = await fetch(`${base}/feed/search/session-dates?${params}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = (await res.json()) as { dates?: unknown[] };
  return Array.isArray(data.dates)
    ? data.dates.filter((d): d is string => typeof d === "string")
    : [];
}

export async function fetchSearchSessions(options: {
  countryCode: string;
  regionId?: string | null;
  spotId?: string | null;
  sessionDate: string;
}): Promise<SearchSessionItem[]> {
  const params = new URLSearchParams({
    countryCode: options.countryCode,
    sessionDate: options.sessionDate,
  });
  if (options.regionId?.trim()) params.set("regionId", options.regionId.trim());
  if (options.spotId?.trim()) params.set("spotId", options.spotId.trim());
  const base = getApiBase();
  const res = await fetch(`${base}/feed/search/sessions?${params}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = (await res.json()) as { sessions?: unknown[] };
  const sessions = Array.isArray(data.sessions) ? data.sessions : [];
  return sessions
    .map(normalizeSearchSession)
    .filter((s): s is SearchSessionItem => s != null);
}

export type FeedSearchParams = {
  countryCode: string;
  regionId: string | null;
  spotId: string | null;
  sessionDate: string;
};

export function parseFeedSearchParams(
  params: URLSearchParams,
): FeedSearchParams | null {
  const country = params.get("country")?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(country)) return null;
  const regionId = params.get("regionId")?.trim() || null;
  const spotId = params.get("spotId")?.trim() || null;
  const sessionDateRaw = params.get("sessionDate")?.trim();
  const sessionDate =
    sessionDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(sessionDateRaw)
      ? sessionDateRaw
      : formatTodayYmd();
  return { countryCode: country, regionId, spotId, sessionDate };
}

export function formatTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildFeedSearchQueryString(
  geo: GeoSearchSelection,
  sessionDate: string,
): string {
  const params = new URLSearchParams({
    country: geo.countryCode,
    sessionDate,
  });
  if (geo.regionId) params.set("regionId", geo.regionId);
  if (geo.spotId) params.set("spotId", geo.spotId);
  return params.toString();
}

export async function resolveGeoFromUrlParams(
  params: FeedSearchParams,
): Promise<GeoSearchSelection> {
  const countryLabel =
    englishCountryLabel(params.countryCode) ?? params.countryCode;

  if (!params.regionId) {
    return {
      type: "country",
      countryCode: params.countryCode,
      label: countryLabel,
      name: countryLabel,
      verified: true,
    };
  }

  const base = getApiBase();
  const rRes = await fetch(
    `${base}/studio/regions?countryCode=${encodeURIComponent(params.countryCode)}&verifiedOnly=true`,
    { credentials: "include" },
  );
  const regions = rRes.ok
    ? ((await rRes.json()) as { regionId: string; name: string }[])
    : [];
  const region = Array.isArray(regions)
    ? regions.find((r) => r.regionId === params.regionId)
    : undefined;
  const regionName = region?.name?.trim() ?? "Region";

  if (!params.spotId) {
    return {
      type: "region",
      countryCode: params.countryCode,
      regionId: params.regionId,
      label: `${regionName} · ${countryLabel}`,
      name: regionName,
      verified: true,
    };
  }

  const sRes = await fetch(
    `${base}/studio/spots?regionId=${encodeURIComponent(params.regionId)}&verifiedOnly=true`,
    { credentials: "include" },
  );
  const spots = sRes.ok
    ? ((await sRes.json()) as { spotId: string; name: string }[])
    : [];
  const spot = Array.isArray(spots)
    ? spots.find((s) => s.spotId === params.spotId)
    : undefined;
  const spotName = spot?.name?.trim() ?? "Spot";

  return {
    type: "spot",
    countryCode: params.countryCode,
    regionId: params.regionId,
    spotId: params.spotId,
    label: `${spotName} · ${regionName} · ${countryLabel}`,
    name: spotName,
    verified: true,
  };
}

export function geoLabelFromSearchParams(params: FeedSearchParams): string {
  const country = englishCountryLabel(params.countryCode) ?? params.countryCode;
  if (params.spotId) return country;
  if (params.regionId) return country;
  return country;
}
