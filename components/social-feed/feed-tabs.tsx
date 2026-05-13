import { cn } from "@/lib/utils";

const tabs = ["For You", "Following", "Recent"] as const;

export function FeedTabs() {
  return (
    <div className="flex gap-6">
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          className={cn(
            "relative pb-2 text-sm font-medium transition",
            i === 0 ? "text-[#26c2c9]" : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {t}
          {i === 0 ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#26c2c9]" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
