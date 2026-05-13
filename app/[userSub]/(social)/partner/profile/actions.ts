"use server";

import { auth0 } from "@/lib/auth0";
import {
  PARTNER_AVATAR_PRESIGN_PATH,
  PARTNER_PROFILE_PATH,
  type AvatarPresignRequestBody,
  type AvatarPresignResponse,
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
  const headers = new Headers(init.headers);
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

function assertPresignPayload(raw: unknown): AvatarPresignResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.uploadUrl !== "string" ||
    typeof o.avatarUrl !== "string" ||
    typeof o.avatarKey !== "string"
  ) {
    return null;
  }
  return {
    uploadUrl: o.uploadUrl,
    method: typeof o.method === "string" ? o.method : "PUT",
    headers:
      o.headers && typeof o.headers === "object" && !Array.isArray(o.headers)
        ? (o.headers as Record<string, string>)
        : undefined,
    avatarKey: o.avatarKey,
    avatarUrl: o.avatarUrl,
  };
}

export async function presignPartnerAvatarAction(
  input: AvatarPresignRequestBody,
): Promise<PartnerProfileActionResult<AvatarPresignResponse>> {
  try {
    const res = await peakdFetch(PARTNER_AVATAR_PRESIGN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: input.contentType,
        ...(input.filename !== undefined ? { filename: input.filename } : {}),
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
      return { ok: false, error: "Invalid presign response" };
    }
    const presign = assertPresignPayload(parsed);
    if (!presign) {
      return { ok: false, error: "Invalid presign payload" };
    }
    return { ok: true, data: presign };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Presign failed";
    return { ok: false, error: msg };
  }
}
