"use client";

import { useMemo } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnglishCountryOptions, type CountryOption } from "@/lib/countries";

function itemEqual(a: CountryOption, b: CountryOption) {
  return a.value === b.value;
}

export function PartnerCountryCombobox({
  id,
  countryCode,
  onCountryCodeChange,
  disabled,
}: {
  id?: string;
  countryCode: string | null;
  onCountryCodeChange: (code: string | null) => void;
  disabled?: boolean;
}) {
  const items = useMemo(() => getEnglishCountryOptions(), []);
  const value = useMemo(
    () => (countryCode ? items.find((c) => c.value === countryCode) ?? null : null),
    [countryCode, items],
  );

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        Country
      </label>
      <Combobox.Root
        items={items}
        value={value}
        onValueChange={(next) => {
          onCountryCodeChange(next?.value ?? null);
        }}
        isItemEqualToValue={itemEqual}
        autoHighlight
        disabled={disabled}
      >
        <div className="relative">
          <Combobox.Input
            id={id}
            placeholder="Search country…"
            className={cn(
              "h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 pr-10 text-sm text-zinc-100 outline-none placeholder:text-zinc-500",
              "focus-visible:border-[#26c2c9]/60 focus-visible:ring-2 focus-visible:ring-[#26c2c9]/25",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
          <Combobox.Trigger
            aria-label="Open country list"
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
          >
            <ChevronDownIcon className="size-4" />
          </Combobox.Trigger>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className="outline-none" sideOffset={4}>
            <Combobox.Popup
              className={cn(
                "z-50 max-h-64 w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-white/10 bg-[#0a1218] py-1 shadow-xl",
                "origin-[var(--transform-origin)]",
              )}
            >
              <Combobox.Empty className="px-3 py-2 text-sm text-zinc-500">No matches.</Combobox.Empty>
              <Combobox.List className="outline-none">
                {(item: CountryOption, index: number) => (
                  <Combobox.Item
                    key={item.value}
                    index={index}
                    value={item}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm text-zinc-200 outline-none",
                      "data-[highlighted]:bg-[#26c2c9]/15 data-[highlighted]:text-zinc-50",
                      "data-[selected]:font-medium",
                    )}
                  >
                    {item.label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
