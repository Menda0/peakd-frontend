"use client";

import { useCallback, useMemo, useState } from "react";
import { format, isValid, parse, startOfMonth } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SearchSessionCalendar({
  valueYmd,
  onChangeYmd,
  datesWithSessions,
  disabled,
  onMonthChange,
  defaultMonth,
  className,
}: {
  valueYmd: string | null;
  onChangeYmd: (ymd: string | null) => void;
  datesWithSessions: Set<string>;
  disabled?: boolean;
  onMonthChange?: (monthYm: string) => void;
  defaultMonth?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!valueYmd) return undefined;
    const d = parse(valueYmd, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [valueYmd]);

  const fallbackMonth = useMemo(() => {
    if (!defaultMonth) return undefined;
    const d = parse(`${defaultMonth}-01`, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [defaultMonth]);

  const handleMonthChange = useCallback(
    (month: Date) => {
      onMonthChange?.(format(startOfMonth(month), "yyyy-MM"));
    },
    [onMonthChange],
  );

  const hasSessionDates = useMemo(() => {
    const dates: Date[] = [];
    for (const ymd of datesWithSessions) {
      const d = parse(ymd, "yyyy-MM-dd", new Date());
      if (isValid(d)) dates.push(d);
    }
    return dates;
  }, [datesWithSessions]);

  const displayLabel = selected
    ? selected.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Any date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 shrink-0 gap-2 rounded-full border-border bg-card px-3 text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground sm:px-4",
            "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden truncate sm:inline">{displayLabel}</span>
          <span className="truncate sm:hidden">
            {selected
              ? selected.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "Date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[min(100vw-1.5rem,18rem)] overflow-hidden border-border bg-popover p-0 text-popover-foreground"
        align="end"
        sideOffset={8}
        collisionPadding={12}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? fallbackMonth ?? new Date()}
          captionLayout="dropdown"
          navLayout="around"
          modifiers={{ hasSession: hasSessionDates }}
          modifiersClassNames={{ hasSession: "rdp-day_hasSession" }}
          onMonthChange={handleMonthChange}
          onSelect={(d) => {
            if (d) {
              onChangeYmd(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
        {selected ? (
          <div className="flex justify-end border-t border-border px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChangeYmd(null);
                setOpen(false);
              }}
            >
              <X className="size-3.5" aria-hidden />
              <span className="ml-1.5">Clear date</span>
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
