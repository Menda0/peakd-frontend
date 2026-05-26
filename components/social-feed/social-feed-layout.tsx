import type { ReactNode } from "react";
import {
  MOCK_SPOTS,
  MOCK_SUGGESTED_USERS,
  MOCK_TRENDING,
} from "@/lib/social-feed-placeholder";
import { DiscoverySidebar } from "./discovery-sidebar";
import { FeedAppBar } from "./feed-app-bar";
import { FeedMainColumn } from "./feed-main-column";
import { FeedNavSidebar } from "./feed-nav-sidebar";

export function SocialFeedLayout({
  homeHref,
  myVideosHref,
  studioHref,
  partnerProfileHref,
  partnerIncomeHref,
  adminRegionsHref,
  adminPeaksHref,
  adminFinanceHref,
  showPartnerNav,
  showAdminNav,
  userPicture,
  userName,
  userEmail,
  children,
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
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <FeedAppBar homeHref={homeHref} />
      <div className="flex min-h-0 flex-1">
        <FeedNavSidebar
          homeHref={homeHref}
          myVideosHref={myVideosHref}
          studioHref={studioHref}
          partnerProfileHref={partnerProfileHref}
          partnerIncomeHref={partnerIncomeHref}
          adminRegionsHref={adminRegionsHref}
          adminPeaksHref={adminPeaksHref}
          adminFinanceHref={adminFinanceHref}
          showPartnerNav={showPartnerNav}
          showAdminNav={showAdminNav}
          userPicture={userPicture}
          userName={userName}
          userEmail={userEmail}
        />
        {children ? (
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
        ) : (
          <FeedMainColumn />
        )}
        <DiscoverySidebar
          trending={MOCK_TRENDING}
          suggestedUsers={MOCK_SUGGESTED_USERS}
          spots={MOCK_SPOTS}
        />
      </div>
    </div>
  );
}
