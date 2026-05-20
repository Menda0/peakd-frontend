import { SlidersHorizontalIcon } from "lucide-react";

export function FilterIconButton() {
  return (
    <button
      type="button"
      className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      aria-label="Filters"
    >
      <SlidersHorizontalIcon className="size-4" />
    </button>
  );
}
