"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs
      value={activeId}
      onValueChange={(value) => onChange(value as FeedTabId)}
      className="min-w-0 gap-0"
    >
      <div className="max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <TabsList className="h-auto w-max">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              title={tab.disabled ? tab.disabledHint : undefined}
              className="h-8 w-auto flex-none shrink-0 px-4"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
