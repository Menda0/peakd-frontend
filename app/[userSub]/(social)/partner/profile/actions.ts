"use server";

import { auth0 } from "@/lib/auth0";
import type { CommercialSettings } from "@/lib/commercial-settings";
import {
  PARTNER_AVATAR_UPLOAD_PATH,
  PARTNER_PROFILE_PATH,
  type PartnerProfileDto,
  type PartnerType,
  normalizePartnerProfileDto,
} from "@/lib/partner-profile";

export type PartnerProfileActionResult<T> =
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
  if (init.body instanceof FormData) {
    headers.delete("Content-Type");
  }
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

export async function getPartnerProfileAction(): Promise<
  PartnerProfileActionResult<PartnerProfileDto>
> {
  try {
    const res = await peakdFetch(PARTNER_PROFILE_PATH, { method: "GET" });
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
    const dto = normalizePartnerProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load profile";
    return { ok: false, error: msg };
  }
}

export type PatchPartnerProfileInput = {
  partnerName?: string | null;
  partnerType?: PartnerType;
  descriptionMarkdown?: string | null;
  countryCode?: string | null;
  avatarKey?: string | null;
  commercialSettings?: CommercialSettings | null;
};

export async function patchPartnerProfileAction(
  patch: PatchPartnerProfileInput,
): Promise<PartnerProfileActionResult<PartnerProfileDto>> {
  try {
    const body = JSON.stringify(patch);
    const res = await peakdFetch(PARTNER_PROFILE_PATH, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
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
    const dto = normalizePartnerProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save profile";
    return { ok: false, error: msg };
  }
}

/** Multipart upload to Nest → S3 (no browser PUT to S3 / CORS issues). */
export async function uploadPartnerAvatarAction(
  formData: FormData,
): Promise<PartnerProfileActionResult<PartnerProfileDto>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Missing or empty image" };
    }
    const outbound = new FormData();
    outbound.append("file", file, file.name);

    const res = await peakdFetch(PARTNER_AVATAR_UPLOAD_PATH, {
      method: "POST",
      body: outbound,
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
    const dto = normalizePartnerProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Avatar upload failed";
    return { ok: false, error: msg };
  }
}
