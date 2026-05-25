"use client";

import { FeedTabs, type FeedTabId, type FeedTabItem } from "./feed-tabs";
import { FilterIconButton } from "./filter-icon-button";

export function FeedToolbar({
  tabs,
  activeTabId,
  onTabChange,
}: {
  tabs: FeedTabItem[];
  activeTabId: FeedTabId;
  onTabChange: (id: FeedTabId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <FeedTabs tabs={tabs} activeId={activeTabId} onChange={onTabChange} />
      <div className="flex items-center gap-2">
        <FilterIconButton />
      </div>
    </div>
  );
}
