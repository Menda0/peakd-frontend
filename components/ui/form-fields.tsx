"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { formLabelClassName } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  description,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={htmlFor} className={formLabelClassName}>
        {label}
      </FieldLabel>
      {children}
      {description ? (
        <FieldDescription className="text-muted-foreground">{description}</FieldDescription>
      ) : null}
    </Field>
  );
}

export function FormCheckboxField({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
  labelClassName,
}: {
  id?: string;
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <Field
      orientation="horizontal"
      className={className}
      data-disabled={disabled ? true : undefined}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <FieldLabel
        htmlFor={id}
        className={cn(formLabelClassName, "font-normal", labelClassName)}
      >
        {label}
      </FieldLabel>
    </Field>
  );
}
