import { cn } from "@/lib/utils";

/** Shared label styling for admin/studio forms. */
export const formLabelClassName = "text-muted-foreground";

/** Shared shadcn Input styling on themed surfaces. */
export const formInputClassName =
  "border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-primary/25";

/** Taller inputs used in profile-style forms. */
export const formInputLgClassName = cn(formInputClassName, "h-10");

/** Shared shadcn Textarea styling on themed surfaces. */
export const formTextareaClassName = cn(formInputClassName, "min-h-24");

/** Shared shadcn Select trigger styling on themed surfaces. */
export const formSelectClassName = cn(
  formInputLgClassName,
  "w-full appearance-none pr-8",
);
