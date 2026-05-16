import type { NavItemConfig } from "@/lib/social-feed-placeholder";
import { NavItem } from "./nav-item";
import { NavSection } from "./nav-section";

export function AdminNav({
  items,
  adminRegionsHref,
}: {
  items: NavItemConfig[];
  adminRegionsHref?: string;
}) {
  return (
    <NavSection title="Admin">
      {items.map((item) => (
        <NavItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          href={item.id === "regions" ? adminRegionsHref : undefined}
        />
      ))}
    </NavSection>
  );
}
