"use client";

import { cn } from "@/lib/utils";

export type FeedTabId = "all" | "country" | "region";

export type FeedTabItem = {
  id: FeedTabId;
  label: string;
  disabled?: boolean;
  disabledHint?: string;
};

export function FeedTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: FeedTabItem[];
  activeId: FeedTabId;
  onChange: (id: FeedTabId) => void;
}) {
  return (
    <div className="flex gap-6">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const isDisabled = tab.disabled === true;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={isDisabled}
            title={isDisabled ? tab.disabledHint : undefined}
            onClick={() => {
              if (isDisabled || isActive) return;
              onChange(tab.id);
            }}
            className={cn(
              "relative max-w-[14ch] truncate pb-2 text-sm font-medium transition",
              isActive
                ? "text-primary"
                : isDisabled
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
