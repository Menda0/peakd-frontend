"use client";

import { useMemo, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formLabelClassName } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

export function SessionDatePicker({
  id = "session-date",
  valueYmd,
  onChangeYmd,
  disabled,
  label = "Session date",
}: {
  id?: string;
  valueYmd: string;
  onChangeYmd: (ymd: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const d = parse(valueYmd, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [valueYmd]);

  const fieldId = id;

  const body = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={fieldId}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start font-normal",
            "border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10",
            "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25",
          )}
        >
          {selected ? selected.toLocaleDateString() : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[min(100vw-1.5rem,18rem)] overflow-hidden p-0"
        align="start"
        sideOffset={6}
        collisionPadding={12}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          captionLayout="dropdown"
          navLayout="around"
          onSelect={(d) => {
            if (d) {
              onChangeYmd(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );

  if (!label) {
    return <div className="w-full">{body}</div>;
  }

  return (
    <Field className="w-full" data-disabled={disabled ? true : undefined}>
      <FieldLabel htmlFor={fieldId} className={formLabelClassName}>
        {label}
      </FieldLabel>
      {body}
    </Field>
  );
}
