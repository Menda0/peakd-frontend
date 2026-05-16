"use server";

import { auth0 } from "@/lib/auth0";
import {
  ADMIN_REGIONS_PATH,
  normalizeAdminRegionDto,
  normalizeAdminRegionList,
  type AdminRegionDto,
} from "@/lib/admin-regions";

export type AdminRegionActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

function audience(): string {
  const raw = process.env.AUTH0_AUDIENCE?.trim();
  if (!raw) {
    throw new Error("AUTH0_AUDIENCE is not set");
  }
  return raw;
}

async function peakdFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await auth0.getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  let token: string;
  try {
    token = (await auth0.getAccessToken({ audience: audience() })).token;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const headers = new Headers(init.headers ?? undefined);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const url = `${apiBase()}/${path}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}

function textOrStatus(res: Response, body: string): string {
  const t = body.trim();
  return t || res.statusText || `Request failed (${res.status})`;
}

export async function listAdminRegionsAction(
  countryCode: string,
): Promise<AdminRegionActionResult<AdminRegionDto[]>> {
  try {
    const cc = countryCode.trim().toUpperCase();
    const res = await peakdFetch(
      `${ADMIN_REGIONS_PATH}?countryCode=${encodeURIComponent(cc)}`,
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
    return { ok: true, data: normalizeAdminRegionList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load regions";
    return { ok: false, error: msg };
  }
}

export async function createAdminRegionAction(input: {
  countryCode: string;
  name: string;
  verified?: boolean;
}): Promise<AdminRegionActionResult<AdminRegionDto>> {
  try {
    const res = await peakdFetch(ADMIN_REGIONS_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        countryCode: input.countryCode.trim().toUpperCase(),
        name: input.name.trim(),
        verified: input.verified === true,
      }),
    });
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
    const dto = normalizeAdminRegionDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected region shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create region";
    return { ok: false, error: msg };
  }
}

export async function updateAdminRegionAction(
  regionId: string,
  patch: {
    name?: string;
    countryCode?: string;
    verified?: boolean;
    disabled?: boolean;
  },
): Promise<AdminRegionActionResult<AdminRegionDto>> {
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name.trim();
    if (patch.countryCode !== undefined) {
      body.countryCode = patch.countryCode.trim().toUpperCase();
    }
    if (patch.verified !== undefined) body.verified = patch.verified;
    if (patch.disabled !== undefined) body.disabled = patch.disabled;

    const res = await peakdFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
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
    const dto = normalizeAdminRegionDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected region shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update region";
    return { ok: false, error: msg };
  }
}

export async function disableAdminRegionAction(
  regionId: string,
): Promise<AdminRegionActionResult<AdminRegionDto>> {
  try {
    const res = await peakdFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}`,
      { method: "DELETE" },
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
    const dto = normalizeAdminRegionDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected region shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to disable region";
    return { ok: false, error: msg };
  }
}
