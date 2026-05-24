import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavItem({
  label,
  icon: Icon,
  active,
  href,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  href?: string;
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
    active
      ? "bg-primary/15 font-medium text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
    !href && "cursor-not-allowed opacity-60",
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <span className={className} aria-disabled="true">
      <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
