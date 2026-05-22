import { ChevronDownIcon } from "lucide-react";

export function PopularSortControl() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10"
    >
      Popular
      <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
    </button>
  );
}
