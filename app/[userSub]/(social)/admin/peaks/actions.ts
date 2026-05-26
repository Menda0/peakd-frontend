"use server";

import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { AdminActionResult } from "@/lib/admin-api";
import { textOrStatus } from "@/lib/admin-api";
import {
  ADMIN_PEAKS_PATH,
  normalizeAdminPeaksGeoList,
  normalizeAdminPeaksSummary,
  normalizeAdminPeaksTransactionsPage,
  type AdminPeaksGeoRowDto,
  type AdminPeaksSummaryDto,
  type AdminPeaksTransactionsPageDto,
} from "@/lib/admin-peaks";

function peaksGeoQuery(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
}): string {
  const params = new URLSearchParams();
  const cc = filter?.countryCode?.trim().toUpperCase();
  const regionId = filter?.regionId?.trim();
  if (cc) params.set("countryCode", cc);
  if (regionId) params.set("regionId", regionId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminPeaksSummaryAction(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
}): Promise<AdminActionResult<AdminPeaksSummaryDto>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_PEAKS_PATH}/summary${peaksGeoQuery(filter)}`,
      { method: "GET" },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON from API" };
    }
    const dto = normalizeAdminPeaksSummary(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected summary shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load Peaks summary";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminPeaksTransactionsAction(options?: {
  limit?: number;
  cursor?: string;
  countryCode?: string | null;
  regionId?: string | null;
}): Promise<AdminActionResult<AdminPeaksTransactionsPageDto>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit != null) {
      params.set("limit", String(options.limit));
    }
    if (options?.cursor?.trim()) {
      params.set("cursor", options.cursor.trim());
    }
    const cc = options?.countryCode?.trim().toUpperCase();
    const regionId = options?.regionId?.trim();
    if (cc) params.set("countryCode", cc);
    if (regionId) params.set("regionId", regionId);
    const qs = params.toString();
    const res = await adminApiFetch(
      `${ADMIN_PEAKS_PATH}/transactions${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON from API" };
    }
    const dto = normalizeAdminPeaksTransactionsPage(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected transactions shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load transactions";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminPeaksByCountryAction(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
}): Promise<AdminActionResult<AdminPeaksGeoRowDto[]>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_PEAKS_PATH}/by-country${peaksGeoQuery(filter)}`,
      { method: "GET" },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON from API" };
    }
    return { ok: true, data: normalizeAdminPeaksGeoList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load country breakdown";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminPeaksByRegionAction(
  countryCode?: string | null,
  regionId?: string | null,
): Promise<AdminActionResult<AdminPeaksGeoRowDto[]>> {
  try {
    const params = new URLSearchParams();
    const cc = countryCode?.trim().toUpperCase();
    const rid = regionId?.trim();
    if (cc) params.set("countryCode", cc);
    if (rid) params.set("regionId", rid);
    const qs = params.toString();
    const res = await adminApiFetch(
      `${ADMIN_PEAKS_PATH}/by-region${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON from API" };
    }
    return { ok: true, data: normalizeAdminPeaksGeoList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load region breakdown";
    return { ok: false, error: msg };
  }
}
