"use server";

import {
  ADMIN_REGIONS_PATH,
  normalizeAdminRegionDto,
  type AdminRegionDto,
} from "@/lib/admin-regions";
import {
  normalizeAdminSpotDto,
  normalizeAdminSpotList,
  type AdminSpotDto,
} from "@/lib/admin-spots";
import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { AdminActionResult } from "@/lib/admin-api";
import { textOrStatus } from "@/lib/admin-api";

export async function getAdminRegionAction(
  regionId: string,
): Promise<AdminActionResult<AdminRegionDto>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}`,
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
    const dto = normalizeAdminRegionDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected region shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load region";
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
): Promise<AdminActionResult<AdminRegionDto>> {
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name.trim();
    if (patch.countryCode !== undefined) {
      body.countryCode = patch.countryCode.trim().toUpperCase();
    }
    if (patch.verified !== undefined) body.verified = patch.verified;
    if (patch.disabled !== undefined) body.disabled = patch.disabled;

    const res = await adminApiFetch(
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
): Promise<AdminActionResult<AdminRegionDto>> {
  try {
    const res = await adminApiFetch(
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

export async function listAdminSpotsAction(
  regionId: string,
): Promise<AdminActionResult<AdminSpotDto[]>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}/spots`,
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
    return { ok: true, data: normalizeAdminSpotList(parsed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load spots";
    return { ok: false, error: msg };
  }
}

export async function createAdminSpotAction(
  regionId: string,
  input: {
    name: string;
    level?: string | null;
    breakType?: string | null;
    consistency?: string | null;
    verified?: boolean;
  },
): Promise<AdminActionResult<AdminSpotDto>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}/spots`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name.trim(),
          level: input.level ?? null,
          breakType: input.breakType ?? null,
          consistency: input.consistency ?? null,
          verified: input.verified === true,
        }),
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
    const dto = normalizeAdminSpotDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected spot shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create spot";
    return { ok: false, error: msg };
  }
}

export async function updateAdminSpotAction(
  regionId: string,
  spotId: string,
  patch: {
    name?: string;
    level?: string | null;
    breakType?: string | null;
    consistency?: string | null;
    verified?: boolean;
    disabled?: boolean;
  },
): Promise<AdminActionResult<AdminSpotDto>> {
  try {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name.trim();
    if (patch.level !== undefined) body.level = patch.level;
    if (patch.breakType !== undefined) body.breakType = patch.breakType;
    if (patch.consistency !== undefined) body.consistency = patch.consistency;
    if (patch.verified !== undefined) body.verified = patch.verified;
    if (patch.disabled !== undefined) body.disabled = patch.disabled;

    const res = await adminApiFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}/spots/${encodeURIComponent(spotId)}`,
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
    const dto = normalizeAdminSpotDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected spot shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update spot";
    return { ok: false, error: msg };
  }
}

export async function disableAdminSpotAction(
  regionId: string,
  spotId: string,
): Promise<AdminActionResult<AdminSpotDto>> {
  try {
    const res = await adminApiFetch(
      `${ADMIN_REGIONS_PATH}/${encodeURIComponent(regionId)}/spots/${encodeURIComponent(spotId)}`,
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
    const dto = normalizeAdminSpotDto(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected spot shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to disable spot";
    return { ok: false, error: msg };
  }
}
