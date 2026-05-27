import { Suspense } from "react";
import {
  FeedAppBarActions,
  type FeedAppBarActionsProps,
} from "./feed-app-bar-actions";
import { FeedLogo } from "./feed-logo";
import { FeedSearchBar } from "./feed-search-bar";

export type FeedAppBarProps = {
  homeHref: string;
  mobileMenu?: FeedAppBarActionsProps["mobileMenu"];
};

export function FeedAppBar({ homeHref, mobileMenu }: FeedAppBarProps) {
  return (
    <header className="app-bar sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:grid sm:h-[4.5rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-5">
      <div className="flex shrink-0 items-center sm:justify-start">
        <FeedLogo href={homeHref} />
      </div>
      <div className="min-w-0 flex-1 sm:flex sm:justify-center sm:px-2">
        <Suspense
          fallback={
            <div className="h-9 w-full animate-pulse rounded-full bg-white/5 sm:h-11" />
          }
        >
          <FeedSearchBar homeHref={homeHref} />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center justify-end">
        <FeedAppBarActions mobileMenu={mobileMenu} />
      </div>
    </header>
  );
}
