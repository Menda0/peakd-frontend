import { FeedAppBarActions } from "./feed-app-bar-actions";
import { FeedLogo } from "./feed-logo";
import { FeedSearchBar } from "./feed-search-bar";

export function FeedAppBar({
  homeHref,
  userPicture,
  userName,
  userEmail,
}: {
  homeHref: string;
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}) {
  return (
    <header className="app-bar sticky top-0 z-20 grid h-[4.25rem] shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] items-center gap-3 border-b px-3 sm:h-[4.5rem] sm:px-5">
      <div className="flex min-w-0 items-center justify-start">
        <FeedLogo href={homeHref} />
      </div>
      <div className="flex min-w-0 justify-center px-1 sm:px-2">
        <FeedSearchBar />
      </div>
      <div className="flex min-w-0 items-center justify-end">
        <FeedAppBarActions
          userPicture={userPicture}
          userName={userName}
          userEmail={userEmail}
        />
      </div>
    </header>
  );
}
