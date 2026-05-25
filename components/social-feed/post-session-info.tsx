import { Star } from "lucide-react";
import type { DiscoverFeedSession } from "@/lib/discover-feed";
import { waveTypeTitle } from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

function ConditionsStars({ rating }: { rating: number | null }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Conditions</span>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={
          rating != null ? `${rating} out of 5 stars` : "Conditions not rated"
        }
      >
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Star
            key={n}
            className={cn(
              "size-3.5 shrink-0",
              rating != null && n <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground",
            )}
            aria-hidden
          />
        ))}
      </div>
      {rating == null ? (
        <span className="text-xs text-muted-foreground">Not rated</span>
      ) : null}
    </div>
  );
}

export function PostSessionInfo({
  sessionSummary,
  session,
}: {
  sessionSummary: string;
  session: DiscoverFeedSession;
}) {
  const waveLabels = session.waveTypes.map((id) => waveTypeTitle(id));

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ConditionsStars rating={session.conditionsRating} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {waveLabels.length > 0 ? (
            waveLabels.map((label) => (
              <span
                key={label}
                className="inline-flex max-w-full items-center truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                title={label}
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No wave types</span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{sessionSummary}</p>
    </div>
  );
}
