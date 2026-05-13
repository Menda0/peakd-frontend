import { MAIN_NAV_ITEMS, PARTNER_NAV_ITEMS } from "@/lib/social-feed-placeholder";
import { MainNav } from "./main-nav";
import { PartnerNav } from "./partner-nav";
import { SidebarPromoCard } from "./sidebar-promo-card";

export function FeedNavSidebar({ studioHref }: { studioHref: string }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-white/10 py-6 pl-4 pr-3 lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <MainNav items={MAIN_NAV_ITEMS} />
        <PartnerNav items={PARTNER_NAV_ITEMS} studioHref={studioHref} />
        {/* <CategoryNav items={CATEGORY_ITEMS} /> */}
      </div>
      <SidebarPromoCard studioHref={studioHref} />
    </aside>
  );
}
