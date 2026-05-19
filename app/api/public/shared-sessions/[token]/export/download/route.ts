import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const target = `${apiBase()}/public/shared-sessions/${encodeURIComponent(token)}/export/download`;

  const upstream = await fetch(target, { cache: "no-store" });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => upstream.statusText);
    return new NextResponse(text, { status: upstream.status });
  }

  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}
