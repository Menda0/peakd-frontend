import { SlidersHorizontalIcon } from "lucide-react";

export function FilterIconButton() {
  return (
    <button
      type="button"
      className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label="Filters"
    >
      <SlidersHorizontalIcon className="size-4" />
    </button>
  );
}
