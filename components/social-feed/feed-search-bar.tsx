import { SearchIcon } from "lucide-react";

export function FeedSearchBar() {
  return (
    <div className="relative mx-4 hidden min-w-0 max-w-2xl flex-1 md:block">
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        readOnly
        placeholder="Search waves, videos, spots, people…"
        className="h-11 w-full rounded-full border border-white/10 bg-white/5 py-2 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-[#26c2c9]/40 focus-visible:ring-2"
      />
    </div>
  );
}
