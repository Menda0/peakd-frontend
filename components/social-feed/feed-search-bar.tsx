import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FeedSearchBar() {
  return (
    <div className="relative w-full max-w-md min-w-0 sm:max-w-xl lg:max-w-2xl">
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        readOnly
        placeholder="Search waves, videos, spots, people…"
        className={cn(
          "h-11 rounded-full border-border bg-muted/50 py-2 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground",
          "ring-primary/40 focus-visible:ring-2",
        )}
      />
    </div>
  );
}
