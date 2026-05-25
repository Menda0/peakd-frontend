import type { PopularSpot, SuggestedUser, TrendingItem } from "@/lib/social-feed-placeholder";
import { PopularSpotsSection } from "./popular-spots-section";
import { SuggestedSection } from "./suggested-section";
import { TrendingSection } from "./trending-section";

export function DiscoverySidebar({
  trending,
  suggestedUsers,
  spots,
}: {
  trending: TrendingItem[];
  suggestedUsers: SuggestedUser[];
  spots: PopularSpot[];
}) {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-sidebar-border bg-sidebar py-6 pl-5 pr-4 xl:block">
      <TrendingSection items={trending} />
      <SuggestedSection users={suggestedUsers} />
      <PopularSpotsSection spots={spots} />
    </aside>
  );
}
