import type { TrendingItem } from "@/lib/social-feed-placeholder";

export function TrendingListItem({ item }: { item: TrendingItem }) {
  return (
    <div className="flex gap-3 rounded-xl py-2">
      <span className="w-5 shrink-0 pt-0.5 text-center text-sm font-bold text-zinc-500">
        {item.rank}
      </span>
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
        <p className="truncate text-xs text-zinc-500">{item.creator}</p>
        <p className="text-xs text-zinc-600">{item.views} views</p>
      </div>
    </div>
  );
}
