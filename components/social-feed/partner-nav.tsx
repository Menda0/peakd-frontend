import type { NavItemConfig } from "@/lib/social-feed-placeholder";
import { NavItem } from "./nav-item";
import { NavSection } from "./nav-section";

export function PartnerNav({ items }: { items: NavItemConfig[] }) {
  return (
    <NavSection title="Partner">
      {items.map((item) => (
        <NavItem key={item.id} label={item.label} icon={item.icon} />
      ))}
    </NavSection>
  );
}
