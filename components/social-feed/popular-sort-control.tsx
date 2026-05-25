import { ChevronDownIcon } from "lucide-react";

export function PopularSortControl() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
    >
      Popular
      <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
    </button>
  );
}
