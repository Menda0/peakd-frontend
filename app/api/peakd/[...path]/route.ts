import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

async function bearerToken(): Promise<string> {
  const { token } = await auth0.getAccessToken({ audience: audience() });
  return token;
}

async function forward(
  request: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<NextResponse> {
  const session = await auth0.getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let token: string;
  try {
    token = await bearerToken();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`${apiBase()}/${path}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("Accept", accept);
  }

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init);

  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await ctx.params;
    return await forward(request, path, "GET");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await ctx.params;
    return await forward(request, path, "POST");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
