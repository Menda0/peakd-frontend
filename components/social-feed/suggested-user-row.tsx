import type { SuggestedUser } from "@/lib/social-feed-placeholder";

export function SuggestedUserRow({ user }: { user: SuggestedUser }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">@{user.handle}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
      >
        Follow
      </button>
    </div>
  );
}
