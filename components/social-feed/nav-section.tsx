import type { ReactNode } from "react";

export function NavSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
