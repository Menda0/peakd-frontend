import type { ResolvedNavItem } from "@/lib/social-feed-nav-routes";
import { NavItem } from "./nav-item";
import { NavSection } from "./nav-section";

export function AdminNav({ items }: { items: ResolvedNavItem[] }) {
  return (
    <NavSection title="Admin">
      {items.map((item) => (
        <NavItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          href={item.href}
          active={item.active}
        />
      ))}
    </NavSection>
  );
}
