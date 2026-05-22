"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { WAVE_TYPE_OPTIONS, type WaveTypeId } from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

export function WaveTypeCheckboxGrid({
  selected,
  onToggle,
  idPrefix = "wave",
  className,
}: {
  selected: WaveTypeId[];
  onToggle: (id: WaveTypeId) => void;
  idPrefix?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2 sm:grid-cols-3 sm:gap-2 sm:p-2.5",
        className,
      )}
    >
      {WAVE_TYPE_OPTIONS.map((w) => {
        const checked = selected.includes(w.id);
        const checkboxId = `${idPrefix}-${w.id}`;
        return (
          <Field
            key={w.id}
            orientation="horizontal"
            className={cn(
              "cursor-pointer items-start gap-2.5 rounded-md border border-transparent p-2 transition-colors",
              "hover:border-white/10 hover:bg-white/5",
              checked && "border-primary/25 bg-primary/5",
            )}
            onClick={() => onToggle(w.id)}
          >
            <Checkbox
              id={checkboxId}
              checked={checked}
              className="mt-0.5 shrink-0"
              onCheckedChange={() => onToggle(w.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="min-w-0 flex-1">
              <FieldLabel
                htmlFor={checkboxId}
                className="text-sm leading-snug font-medium text-zinc-100"
              >
                {w.title}
              </FieldLabel>
              <FieldDescription className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                {w.description}
              </FieldDescription>
            </div>
          </Field>
        );
      })}
    </div>
  );
}
