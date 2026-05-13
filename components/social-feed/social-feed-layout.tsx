import type { ReactNode } from "react";
import {
  MOCK_POSTS,
  MOCK_SPOTS,
  MOCK_STORIES,
  MOCK_SUGGESTED_USERS,
  MOCK_TRENDING,
} from "@/lib/social-feed-placeholder";
import { DiscoverySidebar } from "./discovery-sidebar";
import { FeedAppBar } from "./feed-app-bar";
import { FeedMainColumn } from "./feed-main-column";
import { FeedNavSidebar } from "./feed-nav-sidebar";

export function SocialFeedLayout({
  homeHref,
  studioHref,
  partnerProfileHref,
  showPartnerNav,
  userPicture,
  userName,
  userEmail,
  children,
}: {
  homeHref: string;
  studioHref: string;
  partnerProfileHref?: string;
  showPartnerNav: boolean;
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-[#040F1E] text-zinc-100">
      <FeedAppBar
        homeHref={homeHref}
        uploadHref={studioHref}
        userPicture={userPicture}
        userName={userName}
        userEmail={userEmail}
      />
      <div className="flex min-h-0 flex-1">
        <FeedNavSidebar
          studioHref={studioHref}
          partnerProfileHref={partnerProfileHref}
          showPartnerNav={showPartnerNav}
        />
        {children ? (
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
        ) : (
          <FeedMainColumn stories={MOCK_STORIES} posts={MOCK_POSTS} />
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
