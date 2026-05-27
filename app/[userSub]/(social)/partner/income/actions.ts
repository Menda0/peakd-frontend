"use server";

import { auth0 } from "@/lib/auth0";
import {
  PARTNER_PAYOUTS_BASE_PATH,
  normalizePartnerEarningsPage,
  normalizePartnerPayoutsStatus,
  type PartnerEarningsPageDto,
  type PartnerPayoutsStatusDto,
} from "@/lib/partner-payouts";

export type PartnerPayoutsActionResult<T> =
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

async function payoutsFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
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

export async function getPartnerPayoutsStatusAction(): Promise<
  PartnerPayoutsActionResult<PartnerPayoutsStatusDto>
> {
  try {
    const res = await payoutsFetch(`${PARTNER_PAYOUTS_BASE_PATH}/status`, {
      method: "GET",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    const dto = normalizePartnerPayoutsStatus(JSON.parse(text) as unknown);
    if (!dto) {
      return { ok: false, error: "Unexpected status shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load payouts status";
    return { ok: false, error: msg };
  }
}

export async function listPartnerEarningsAction(options?: {
  limit?: number;
  cursor?: string;
}): Promise<PartnerPayoutsActionResult<PartnerEarningsPageDto>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit != null) params.set("limit", String(options.limit));
    if (options?.cursor?.trim()) params.set("cursor", options.cursor.trim());
    const qs = params.toString();
    const res = await payoutsFetch(
      `${PARTNER_PAYOUTS_BASE_PATH}/earnings${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    const dto = normalizePartnerEarningsPage(JSON.parse(text) as unknown);
    if (!dto) {
      return { ok: false, error: "Unexpected earnings shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load earnings";
    return { ok: false, error: msg };
  }
}

export async function startPartnerOnboardingAction(): Promise<
  PartnerPayoutsActionResult<{ url: string }>
> {
  try {
    const res = await payoutsFetch(
      `${PARTNER_PAYOUTS_BASE_PATH}/onboarding-link`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: textOrStatus(res, text) };
    }
    const parsed = JSON.parse(text) as { url?: unknown };
    if (typeof parsed.url !== "string" || !parsed.url) {
      return { ok: false, error: "Onboarding URL missing from response" };
    }
    return { ok: true, data: { url: parsed.url } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start onboarding";
    return { ok: false, error: msg };
  }
}
