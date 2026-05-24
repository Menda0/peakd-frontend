import { cn } from "@/lib/utils";

export function AdminStatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "verified" | "disabled" | "unverified";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "verified" && "bg-emerald-500/20 text-emerald-300",
        variant === "disabled" && "bg-zinc-500/30 text-muted-foreground",
        variant === "unverified" && "bg-amber-500/20 text-amber-200",
      )}
    >
      {label}
    </span>
  );
}

export function adminStatusVariant(
  disabled: boolean,
  verified: boolean,
): "verified" | "disabled" | "unverified" {
  if (disabled) return "disabled";
  if (verified) return "verified";
  return "unverified";
}
