"use client";

import { CountryPicker } from "@/components/pickers/country-picker";

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
  return (
    <CountryPicker
      id={id}
      label="Country"
      countryCode={countryCode}
      onCountryCodeChange={onCountryCodeChange}
      disabled={disabled}
    />
  );
}
