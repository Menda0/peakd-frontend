import {
  ADMIN_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  PARTNER_NAV_ITEMS,
  type NavItemConfig,
} from "@/lib/social-feed-placeholder";

export type ResolvedNavItem = NavItemConfig & {
  href?: string;
  active: boolean;
};

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function pathMatches(href: string, pathname: string): boolean {
  const p = normalizePathname(pathname);
  const h = normalizePathname(href);
  return p === h;
}

function pathMatchesOrChild(href: string, pathname: string): boolean {
  const p = normalizePathname(pathname);
  const h = normalizePathname(href);
  return p === h || p.startsWith(`${h}/`);
}

export function resolveMainNavItems(
  pathname: string,
  options: {
    homeHref: string;
    myVideosHref: string;
    studioHref: string;
    showPartnerNav: boolean;
  },
): ResolvedNavItem[] {
  const exploreActive = pathMatches(options.homeHref, pathname);
  const myVideosActive = pathMatchesOrChild(options.myVideosHref, pathname);

  return MAIN_NAV_ITEMS.map((item) => {
    switch (item.id) {
      case "explore":
        return {
          ...item,
          href: options.homeHref,
          active: exploreActive,
        };
      case "my-videos":
        return {
          ...item,
          href: options.myVideosHref,
          active: myVideosActive,
        };
      default:
        return { ...item, active: false };
    }
  });
}

export function resolvePartnerNavItems(
  pathname: string,
  options: {
    studioHref: string;
    partnerProfileHref?: string;
    partnerIncomeHref?: string;
  },
): ResolvedNavItem[] {
  const studioActive = pathMatchesOrChild(options.studioHref, pathname);
  const profileActive = options.partnerProfileHref
    ? pathMatchesOrChild(options.partnerProfileHref, pathname)
    : false;
  const incomeActive = options.partnerIncomeHref
    ? pathMatchesOrChild(options.partnerIncomeHref, pathname)
    : false;

  return PARTNER_NAV_ITEMS.map((item) => {
    switch (item.id) {
      case "studio":
        return {
          ...item,
          href: options.studioHref,
          active: studioActive,
        };
      case "profile":
        return {
          ...item,
          href: options.partnerProfileHref,
          active: profileActive,
        };
      case "income":
        return {
          ...item,
          href: options.partnerIncomeHref,
          active: incomeActive,
        };
      default:
        return { ...item, active: false };
    }
  });
}

export function resolveAdminNavItems(
  pathname: string,
  options: { adminRegionsHref?: string; adminPeaksHref?: string },
): ResolvedNavItem[] {
  const regionsActive = options.adminRegionsHref
    ? pathMatchesOrChild(options.adminRegionsHref, pathname)
    : false;
  const peaksActive = options.adminPeaksHref
    ? pathMatchesOrChild(options.adminPeaksHref, pathname)
    : false;

  return ADMIN_NAV_ITEMS.map((item) => {
    switch (item.id) {
      case "regions":
        return {
          ...item,
          href: options.adminRegionsHref,
          active: regionsActive,
        };
      case "peaks":
        return {
          ...item,
          href: options.adminPeaksHref,
          active: peaksActive,
        };
      default:
        return { ...item, active: false };
    }
  });
}
