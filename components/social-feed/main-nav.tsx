import type { NavItemConfig } from "@/lib/social-feed-placeholder";
import { NavItem } from "./nav-item";
import { NavSection } from "./nav-section";

export function MainNav({ items }: { items: NavItemConfig[] }) {
  return (
    <NavSection>
      {items.map((item) => (
        <NavItem key={item.id} label={item.label} icon={item.icon} active={item.active} />
      ))}
    </NavSection>
  );
}
