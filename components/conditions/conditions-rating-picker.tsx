"use client";

import { Button } from "@/components/ui/button";
import { SURFLINE_CONDITION_RATINGS } from "@/lib/surfline-conditions";
import { cn } from "@/lib/utils";

export function ConditionsRatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "border-border",
          value === null
            ? "bg-primary/20 text-foreground"
            : "bg-transparent text-muted-foreground",
        )}
        onClick={() => onChange(null)}
      >
        No rating
      </Button>
      {SURFLINE_CONDITION_RATINGS.map(({ value: rating, label }) => (
        <Button
          key={rating}
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "border-border",
            value === rating
              ? "bg-primary/25 text-primary"
              : "bg-transparent text-muted-foreground",
          )}
          onClick={() => onChange(rating)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
