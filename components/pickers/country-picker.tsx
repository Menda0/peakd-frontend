"use client";

import { useMemo } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { getEnglishCountryOptions, type CountryOption } from "@/lib/countries";

export function CountryPicker({
  id,
  label,
  countryCode,
  onCountryCodeChange,
  disabled,
  inputClassName,
  positionerClassName,
}: {
  id?: string;
  label?: string;
  countryCode: string | null;
  onCountryCodeChange: (code: string | null) => void;
  disabled?: boolean;
  inputClassName?: string;
  /** Forwarded to combobox portal so the list appears above high z-index modals. */
  positionerClassName?: string;
}) {
  const items = useMemo(() => getEnglishCountryOptions(), []);
  const value = useMemo(
    () => (countryCode ? items.find((c) => c.value === countryCode) ?? null : null),
    [countryCode, items],
  );

  const field = (
    <Combobox
      items={items}
      value={value}
      onValueChange={(next) => {
        onCountryCodeChange(next?.value ?? null);
      }}
      isItemEqualToValue={(a, b) => a.value === b.value}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder="Search country…"
        disabled={disabled}
        className={cn(
          "h-10 w-full min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
          "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
          inputClassName,
        )}
      />
      <ComboboxContent
        className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
        positionerClassName={positionerClassName}
        align="start"
      >
        <ComboboxEmpty className="text-zinc-500">No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: CountryOption) => (
            <ComboboxItem
              key={item.value}
              value={item}
              className="text-zinc-200 data-highlighted:bg-primary/15 data-highlighted:text-zinc-50"
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );

  if (label) {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
          {label}
        </label>
        {field}
      </div>
    );
  }

  return field;
}
