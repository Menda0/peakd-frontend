"use client";

import { useMemo, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SessionDatePicker({
  id,
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

  const labelText = useMemo(() => {
    if (!selected) return "Pick a date";
    return format(selected, "MMMM d, yyyy");
  }, [selected]);

  return (
    <div className="space-y-1.5">
      {label ? (
        <span className="block text-sm font-medium text-zinc-300">{label}</span>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          nativeButton={false}
          disabled={disabled}
          render={
            <Button
              type="button"
              id={id}
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-10 w-full justify-start gap-2 border-white/15 bg-white/5 font-normal text-zinc-100 hover:bg-white/10",
                "focus-visible:border-[#26c2c9]/60 focus-visible:ring-2 focus-visible:ring-[#26c2c9]/25",
              )}
            />
          }
        >
          <CalendarDays className="size-4 shrink-0 text-zinc-400" />
          <span className="truncate">{labelText}</span>
        </PopoverTrigger>
        <PopoverContent className="border-white/10 bg-[#0a1218] p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChangeYmd(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
