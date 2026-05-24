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
import { SidebarPromoCard } from "./sidebar-promo-card";

export function FeedNavSidebar({
  homeHref,
  myVideosHref,
  studioHref,
  partnerProfileHref,
  adminRegionsHref,
  adminPeaksHref,
  showPartnerNav,
  showAdminNav,
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
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-white/10 py-6 pl-4 pr-3 lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <MainNav items={mainItems} />
        {showPartnerNav ? <PartnerNav items={partnerItems} /> : null}
        {showAdminNav ? <AdminNav items={adminItems} /> : null}
      </div>
      <SidebarPromoCard studioHref={studioHref} />
    </aside>
  );
}
