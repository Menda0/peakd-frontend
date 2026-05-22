import { FeedTabs } from "./feed-tabs";
import { FilterIconButton } from "./filter-icon-button";

export function FeedToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <FeedTabs />
      <div className="flex items-center gap-2">
        <FilterIconButton />
      </div>
    </div>
  );
}
