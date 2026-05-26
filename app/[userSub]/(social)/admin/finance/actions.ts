"use server";

import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { AdminActionResult } from "@/lib/admin-api";
import { textOrStatus } from "@/lib/admin-api";
import {
  ADMIN_FINANCE_PATH,
  normalizeAdminFinanceOverview,
  type AdminFinanceOverviewDto,
} from "@/lib/admin-finance";

export async function fetchAdminFinanceOverviewAction(): Promise<
  AdminActionResult<AdminFinanceOverviewDto>
> {
  try {
    const res = await adminApiFetch(`${ADMIN_FINANCE_PATH}/overview`, {
      method: "GET",
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
    const dto = normalizeAdminFinanceOverview(parsed);
    if (!dto) {
      return { ok: false, error: "Unexpected finance overview shape from API" };
    }
    return { ok: true, data: dto };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to load finance overview";
    return { ok: false, error: msg };
  }
}
