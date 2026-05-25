"use client";

import { usePathname } from "next/navigation";
import {
  resolveAdminNavItems,
  resolveMainNavItems,
  resolvePartnerNavItems,
} from "@/lib/social-feed-nav-routes";
import { AdminNav } from "./admin-nav";
import { MainNav } from "./main-nav";
import { PartnerNav } from "./partner-nav";

export function FeedNavSidebar({
  homeHref,
  myVideosHref,
  partnerProfileHref,
  adminRegionsHref,
  adminPeaksHref,
  showPartnerNav,
  showAdminNav,
  studioHref,
}: {
  homeHref: string;
  myVideosHref: string;
  studioHref: string;
  partnerProfileHref?: string;
  adminRegionsHref?: string;
  adminPeaksHref?: string;
  showPartnerNav: boolean;
  showAdminNav: boolean;
}) {
  const pathname = usePathname() ?? "";

  const mainItems = resolveMainNavItems(pathname, {
    homeHref,
    myVideosHref,
    studioHref,
    showPartnerNav,
  });
  const partnerItems = resolvePartnerNavItems(pathname, {
    studioHref,
    partnerProfileHref,
  });
  const adminItems = resolveAdminNavItems(pathname, {
    adminRegionsHref,
    adminPeaksHref,
  });

  return (
    <aside className="sticky top-[4.25rem] z-10 hidden max-h-[calc(100dvh-4.25rem)] w-56 shrink-0 flex-col gap-6 overflow-y-auto border-r border-sidebar-border bg-sidebar py-6 pl-4 pr-3 sm:top-[4.5rem] sm:max-h-[calc(100dvh-4.5rem)] lg:flex">
      <MainNav items={mainItems} />
      {showPartnerNav ? <PartnerNav items={partnerItems} /> : null}
      {showAdminNav ? <AdminNav items={adminItems} /> : null}
    </aside>
  );
}
