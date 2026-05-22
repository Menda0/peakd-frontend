import type { TrendingItem } from "@/lib/social-feed-placeholder";
import { TrendingListItem } from "./trending-list-item";

export function TrendingSection({ items }: { items: TrendingItem[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-zinc-100">Trending</h2>
      <div className="flex flex-col divide-y divide-white/5">
        {items.map((item) => (
          <TrendingListItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
