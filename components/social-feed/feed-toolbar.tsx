import { FeedTabs } from "./feed-tabs";
import { FilterIconButton } from "./filter-icon-button";
import { PopularSortControl } from "./popular-sort-control";

export function FeedToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
      <FeedTabs />
      <div className="flex items-center gap-2">
        <PopularSortControl />
        <FilterIconButton />
      </div>
    </div>
  );
}
