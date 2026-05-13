import type { LucideIcon } from "lucide-react";
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
      ? "bg-[#26c2c9]/15 font-medium text-[#26c2c9]"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
  );

  if (href) {
    return (
      <a href={href} className={className}>
        <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button type="button" className={className}>
      <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
