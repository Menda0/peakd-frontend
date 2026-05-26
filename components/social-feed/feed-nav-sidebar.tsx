"use client";

import { usePathname } from "next/navigation";
import {
  resolveAdminNavItems,
  resolveMainNavItems,
  resolvePartnerNavItems,
} from "@/lib/social-feed-nav-routes";
import { AdminNav } from "./admin-nav";
import { FeedUserMenu } from "./feed-user-menu";
import { MainNav } from "./main-nav";
import { PartnerNav } from "./partner-nav";

export function FeedNavSidebar({
  homeHref,
  myVideosHref,
  partnerProfileHref,
  partnerIncomeHref,
  adminRegionsHref,
  adminPeaksHref,
  adminFinanceHref,
  showPartnerNav,
  showAdminNav,
  studioHref,
  userPicture,
  userName,
  userEmail,
}: {
  homeHref: string;
  myVideosHref: string;
  studioHref: string;
  partnerProfileHref?: string;
  partnerIncomeHref?: string;
  adminRegionsHref?: string;
  adminPeaksHref?: string;
  adminFinanceHref?: string;
  showPartnerNav: boolean;
  showAdminNav: boolean;
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
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
    partnerIncomeHref,
  });
  const adminItems = resolveAdminNavItems(pathname, {
    adminRegionsHref,
    adminPeaksHref,
    adminFinanceHref,
  });

  return (
    <aside className="sticky top-[4.25rem] z-10 hidden h-[calc(100dvh-4.25rem)] w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:top-[4.5rem] sm:h-[calc(100dvh-4.5rem)] lg:flex">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-6 pl-4 pr-3">
        <MainNav items={mainItems} />
        {showPartnerNav ? <PartnerNav items={partnerItems} /> : null}
        {showAdminNav ? <AdminNav items={adminItems} /> : null}
      </div>
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <FeedUserMenu
          userPicture={userPicture}
          userName={userName}
          userEmail={userEmail}
        />
      </div>
    </aside>
  );
}
