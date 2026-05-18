import { cn } from "@/lib/utils";

const tabs = ["For You", "Following", "Recent"] as const;

export function FeedTabs() {
  return (
    <div className="flex gap-6">
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          disabled={i !== 0}
          className={cn(
            "relative pb-2 text-sm font-medium transition",
            i === 0 ? "text-primary" : "cursor-not-allowed text-zinc-600",
          )}
        >
          {t}
          {i === 0 ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
