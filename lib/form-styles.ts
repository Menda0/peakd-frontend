import { cn } from "@/lib/utils";

/** Shared label styling for dark admin/studio forms. */
export const formLabelClassName = "text-zinc-300";

/** Shared shadcn Input styling on dark surfaces. */
export const formInputClassName =
  "border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-primary/60 focus-visible:ring-primary/25";

/** Taller inputs used in profile-style forms. */
export const formInputLgClassName = cn(formInputClassName, "h-10");

/** Shared shadcn Textarea styling on dark surfaces. */
export const formTextareaClassName = cn(formInputClassName, "min-h-24");

/** Shared shadcn Select trigger styling on dark surfaces. */
export const formSelectClassName = cn(
  formInputLgClassName,
  "w-full appearance-none pr-8",
);
