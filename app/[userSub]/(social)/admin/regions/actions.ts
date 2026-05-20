"use server";

import {
  ADMIN_REGIONS_PATH,
  normalizeAdminRegionDto,
  normalizeAdminRegionList,
  type AdminRegionDto,
} from "@/lib/admin-regions";
import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { AdminActionResult } from "@/lib/admin-api";
import { textOrStatus } from "@/lib/admin-api";

export async function listAdminRegionsAction(
  countryCode: string,
): Promise<AdminActionResult<AdminRegionDto[]>> {
  try {
    const cc = countryCode.trim().toUpperCase();
    const res = await adminApiFetch(
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
}): Promise<AdminActionResult<AdminRegionDto>> {
  try {
    const res = await adminApiFetch(ADMIN_REGIONS_PATH, {
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
