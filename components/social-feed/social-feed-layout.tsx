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
  uploadHref,
  userPicture,
  userName,
  userEmail,
}: {
  homeHref: string;
  uploadHref: string;
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}) {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-[#040A10] text-zinc-100">
      <FeedAppBar
        homeHref={homeHref}
        uploadHref={uploadHref}
        userPicture={userPicture}
        userName={userName}
        userEmail={userEmail}
      />
      <div className="flex min-h-0 flex-1">
        <FeedNavSidebar uploadHref={uploadHref} />
        <FeedMainColumn stories={MOCK_STORIES} posts={MOCK_POSTS} />
        <DiscoverySidebar
          trending={MOCK_TRENDING}
          suggestedUsers={MOCK_SUGGESTED_USERS}
          spots={MOCK_SPOTS}
        />
      </div>
    </div>
  );
}
