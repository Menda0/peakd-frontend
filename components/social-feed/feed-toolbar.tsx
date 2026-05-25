"use client";

import {
  FeedFiltersPopover,
  type FeedFiltersState,
} from "./feed-filters-popover";
import { FeedTabs, type FeedTabId, type FeedTabItem } from "./feed-tabs";

export function FeedToolbar({
  tabs,
  activeTabId,
  onTabChange,
  filters,
  onFiltersChange,
  countryCode,
  homeRegionId,
  homeRegionName,
}: {
  tabs: FeedTabItem[];
  activeTabId: FeedTabId;
  onTabChange: (id: FeedTabId) => void;
  filters: FeedFiltersState;
  onFiltersChange: (next: FeedFiltersState) => void;
  countryCode: string | null;
  homeRegionId: string | null;
  homeRegionName: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <FeedTabs tabs={tabs} activeId={activeTabId} onChange={onTabChange} />
      <div className="flex items-center gap-2">
        <FeedFiltersPopover
          activeTabId={activeTabId}
          countryCode={countryCode}
          homeRegionId={homeRegionId}
          homeRegionName={homeRegionName}
          value={filters}
          onApply={onFiltersChange}
          onReset={() => {
            if (activeTabId === "all") {
              onFiltersChange({
                ...filters,
                all: { geo: null },
              });
            } else if (activeTabId === "country") {
              onFiltersChange({
                ...filters,
                country: { regionIds: [], spotIds: [] },
              });
            } else {
              onFiltersChange({
                ...filters,
                region: { spotIds: [] },
              });
            }
          }}
        />
      </div>
    </div>
  );
}
