import { surflineConditionsLabel } from "@/lib/surfline-conditions";
import { cn } from "@/lib/utils";

export const conditionsTagClassName =
  "inline-flex shrink-0 whitespace-nowrap rounded-md border border-primary/45 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary";

export const waveTypeTagClassName =
  "inline-flex shrink-0 whitespace-nowrap rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground";

export function ConditionsRatingTag({
  rating,
  className,
}: {
  rating: number | null;
  className?: string;
}) {
  const label = surflineConditionsLabel(rating);
  if (!label) return null;

  return (
    <span
      className={cn(conditionsTagClassName, className)}
      title="Session conditions"
    >
      {label}
    </span>
  );
}

export function SessionTagsRow({
  conditionsRating,
  waveLabels,
  className,
  emptyMessage = "No wave types",
}: {
  conditionsRating: number | null;
  waveLabels: string[];
  className?: string;
  emptyMessage?: string;
}) {
  const conditionsTag = (
    <ConditionsRatingTag rating={conditionsRating} />
  );
  const hasWaves = waveLabels.length > 0;

  if (!conditionsTag && !hasWaves) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {emptyMessage}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {conditionsTag}
      {waveLabels.map((label) => (
        <span key={label} className={waveTypeTagClassName}>
          {label}
        </span>
      ))}
    </div>
  );
}
