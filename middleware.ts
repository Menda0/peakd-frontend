import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  const authRes = await auth0.middleware(request);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/auth")) {
    return authRes;
  }

  if (pathname.startsWith("/api/peakd")) {
    return authRes;
  }

  // Next internals and public files must not be session-redirected. The image optimizer
  // fetches /logos/* (and similar) server-side; treating the first segment as userSub breaks that.
  if (pathname.startsWith("/_next/") || pathname.startsWith("/logos/")) {
    return authRes;
  }

  const isRootPublicAsset = /^\/[^/]+\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot|txt|xml|json|webmanifest)$/i.test(
    pathname,
  );
  if (isRootPublicAsset) {
    return authRes;
  }

  const session = await auth0.getSession(request);

  if (session?.user?.sub && (pathname === "/videographer" || pathname.startsWith("/videographer/"))) {
    const rest = pathname === "/videographer" ? "" : pathname.slice("/videographer".length);
    const target = `/${encodeURIComponent(session.user.sub)}/studio${rest}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (session?.user?.sub && (pathname === "/studio" || pathname.startsWith("/studio/"))) {
    const rest = pathname === "/studio" ? "" : pathname.slice("/studio".length);
    const target = `/${encodeURIComponent(session.user.sub)}/studio${rest}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (session?.user?.sub && (pathname === "/partner" || pathname.startsWith("/partner/"))) {
    const rest = pathname === "/partner" ? "" : pathname.slice("/partner".length);
    const target = `/${encodeURIComponent(session.user.sub)}/partner${rest}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (session?.user?.sub && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const rest = pathname === "/admin" ? "" : pathname.slice("/admin".length);
    const target = `/${encodeURIComponent(session.user.sub)}/admin${rest}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!session) {
    const returnTo = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/auth/login?returnTo=${returnTo}`, request.url));
  }

  if (pathname === "/") {
    return authRes;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return authRes;
  }

  const first = parts[0];
  let decodedFirst = first;
  try {
    decodedFirst = decodeURIComponent(first);
  } catch {
    decodedFirst = first;
  }

  if (decodedFirst !== session.user.sub) {
    const rest = parts.slice(1).join("/");
    const target = `/${encodeURIComponent(session.user.sub)}${rest ? `/${rest}` : ""}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
