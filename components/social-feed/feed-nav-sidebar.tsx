import {
  CATEGORY_ITEMS,
  LIBRARY_ITEMS,
  MAIN_NAV_ITEMS,
} from "@/lib/social-feed-placeholder";
import { CategoryNav } from "./category-nav";
import { LibraryNav } from "./library-nav";
import { MainNav } from "./main-nav";
import { SidebarPromoCard } from "./sidebar-promo-card";

export function FeedNavSidebar({ uploadHref }: { uploadHref: string }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-white/10 py-6 pl-4 pr-3 lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <MainNav items={MAIN_NAV_ITEMS} />
        <LibraryNav items={LIBRARY_ITEMS} />
        <CategoryNav items={CATEGORY_ITEMS} />
      </div>
      <SidebarPromoCard uploadHref={uploadHref} />
    </aside>
  );
}
