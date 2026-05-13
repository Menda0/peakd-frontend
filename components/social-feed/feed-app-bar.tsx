import { FeedAppBarActions } from "./feed-app-bar-actions";
import { FeedLogo } from "./feed-logo";
import { FeedSearchBar } from "./feed-search-bar";

export function FeedAppBar({
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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[#050a0f]/95 px-4 backdrop-blur-md sm:px-6">
      <FeedLogo href={homeHref} />
      <FeedSearchBar />
      <FeedAppBarActions
        userPicture={userPicture}
        userName={userName}
        userEmail={userEmail}
        uploadHref={uploadHref}
      />
    </header>
  );
}
