"use server";

import { auth0 } from "@/lib/auth0";
import {
  USER_ONBOARDING_PROMPT_PATH,
  USER_PROFILE_PATH,
  type UserProfileDto,
  normalizeUserProfileDto,
} from "@/lib/user-profile";

export type UserProfileActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

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

export async function getUserProfileAction(): Promise<UserProfileActionResult<UserProfileDto>> {
  try {
    const res = await peakdFetch(USER_PROFILE_PATH, { method: "GET" });
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
    const dto = normalizeUserProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load profile";
    return { ok: false, error: msg };
  }
}

export type PatchUserProfileInput = {
  displayName?: string | null;
  nickname?: string | null;
  countryCode?: string | null;
  homeRegionId?: string | null;
  surfLevel?: string | null;
};

export async function patchUserProfileAction(
  patch: PatchUserProfileInput,
): Promise<UserProfileActionResult<UserProfileDto>> {
  try {
    const body = JSON.stringify(patch);
    const res = await peakdFetch(USER_PROFILE_PATH, {
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
    const dto = normalizeUserProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save profile";
    return { ok: false, error: msg };
  }
}

export async function recordOnboardingPromptAction(): Promise<
  UserProfileActionResult<UserProfileDto>
> {
  try {
    const res = await peakdFetch(USER_ONBOARDING_PROMPT_PATH, { method: "POST" });
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
    const dto = normalizeUserProfileDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected profile shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to record onboarding prompt";
    return { ok: false, error: msg };
  }
}
