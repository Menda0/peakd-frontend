"use client";

import { FormField } from "@/components/ui/form-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formSelectClassName } from "@/lib/form-styles";
import {
  SPOT_BREAK_TYPE_OPTIONS,
  SPOT_CONSISTENCY_OPTIONS,
  SPOT_LEVEL_OPTIONS,
  type SpotBreakType,
  type SpotConsistency,
  type SpotLevelId,
} from "@/lib/spot-attributes";
import { cn } from "@/lib/utils";

const noneValue = "__none__";

const selectContentClassName =
  "border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10";

const levelItems = SPOT_LEVEL_OPTIONS.map((o) => ({
  value: o.id,
  label: o.label,
}));

export function SpotLevelMultiSelect({
  value,
  onChange,
  disabled,
  className,
  id,
}: {
  value: SpotLevelId[];
  onChange: (levels: SpotLevelId[]) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <Select
      multiple
      items={levelItems}
      value={value}
      onValueChange={(levels) => onChange(levels as SpotLevelId[])}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn(formSelectClassName, "h-8", className)}>
        <SelectValue placeholder="Select levels" />
      </SelectTrigger>
      <SelectContent className={selectContentClassName}>
        {SPOT_LEVEL_OPTIONS.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SpotBreakTypeSelect({
  value,
  onChange,
  disabled,
  className,
  id,
  label = "Break type",
  showLabel = true,
}: {
  value: SpotBreakType | "";
  onChange: (value: SpotBreakType | "") => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  showLabel?: boolean;
}) {
  const select = (
    <Select
      value={value || noneValue}
      onValueChange={(v) => onChange(v === noneValue ? "" : (v as SpotBreakType))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn(formSelectClassName, "h-8", className)}>
        <SelectValue placeholder="Select break type" />
      </SelectTrigger>
      <SelectContent className={selectContentClassName}>
        <SelectItem value={noneValue}>Not set</SelectItem>
        {SPOT_BREAK_TYPE_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (!showLabel) return select;

  return (
    <FormField label={label} htmlFor={id}>
      {select}
    </FormField>
  );
}

export function SpotConsistencySelect({
  value,
  onChange,
  disabled,
  className,
  id,
  label = "Consistency",
  showLabel = true,
}: {
  value: SpotConsistency | "";
  onChange: (value: SpotConsistency | "") => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  showLabel?: boolean;
}) {
  const select = (
    <Select
      value={value || noneValue}
      onValueChange={(v) => onChange(v === noneValue ? "" : (v as SpotConsistency))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn(formSelectClassName, "h-8", className)}>
        <SelectValue placeholder="Select consistency" />
      </SelectTrigger>
      <SelectContent className={selectContentClassName}>
        <SelectItem value={noneValue}>Not set</SelectItem>
        {SPOT_CONSISTENCY_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (!showLabel) return select;

  return (
    <FormField label={label} htmlFor={id} className={className}>
      {select}
    </FormField>
  );
}
