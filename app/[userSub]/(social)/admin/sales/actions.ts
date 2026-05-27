"use server";

import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { AdminActionResult } from "@/lib/admin-api";
import { textOrStatus } from "@/lib/admin-api";
import {
  ADMIN_SALES_PATH,
  normalizeAdminSalesGeoList,
  normalizeAdminSalesSummary,
  normalizeAdminSalesTransactionsPage,
  type AdminSalesGeoRowDto,
  type AdminSalesSummaryDto,
  type AdminSalesTransactionsPageDto,
} from "@/lib/admin-sales";

function salesGeoQuery(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
  currency?: string | null;
}): string {
  const params = new URLSearchParams();
  const cc = filter?.countryCode?.trim().toUpperCase();
  const regionId = filter?.regionId?.trim();
  const currency = filter?.currency?.trim().toUpperCase();
  if (cc) params.set("countryCode", cc);
  if (regionId) params.set("regionId", regionId);
  if (currency) params.set("currency", currency);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminSalesSummaryAction(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
  currency?: string | null;
}): Promise<AdminActionResult<AdminSalesSummaryDto>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_SALES_PATH}/summary${salesGeoQuery(filter)}`,
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
    const dto = normalizeAdminSalesSummary(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected summary shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load sales summary";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminSalesTransactionsAction(options?: {
  limit?: number;
  cursor?: string;
  countryCode?: string | null;
  regionId?: string | null;
  currency?: string | null;
}): Promise<AdminActionResult<AdminSalesTransactionsPageDto>> {
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
    const currency = options?.currency?.trim().toUpperCase();
    if (cc) params.set("countryCode", cc);
    if (regionId) params.set("regionId", regionId);
    if (currency) params.set("currency", currency);
    const qs = params.toString();
    const res = await adminApiFetch(
      `${ADMIN_SALES_PATH}/transactions${qs ? `?${qs}` : ""}`,
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
    const dto = normalizeAdminSalesTransactionsPage(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected transactions shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load transactions";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminSalesByCountryAction(filter?: {
  countryCode?: string | null;
  regionId?: string | null;
  currency?: string | null;
}): Promise<AdminActionResult<AdminSalesGeoRowDto[]>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_SALES_PATH}/by-country${salesGeoQuery(filter)}`,
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
    return { ok: true, data: normalizeAdminSalesGeoList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load country breakdown";
    return { ok: false, error: msg };
  }
}

export async function fetchAdminSalesByRegionAction(
  countryCode?: string | null,
  regionId?: string | null,
  currency?: string | null,
): Promise<AdminActionResult<AdminSalesGeoRowDto[]>> {
  try {
    const params = new URLSearchParams();
    const cc = countryCode?.trim().toUpperCase();
    const rid = regionId?.trim();
    const cur = currency?.trim().toUpperCase();
    if (cc) params.set("countryCode", cc);
    if (rid) params.set("regionId", rid);
    if (cur) params.set("currency", cur);
    const qs = params.toString();
    const res = await adminApiFetch(
      `${ADMIN_SALES_PATH}/by-region${qs ? `?${qs}` : ""}`,
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
    return { ok: true, data: normalizeAdminSalesGeoList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load region breakdown";
    return { ok: false, error: msg };
  }
}
