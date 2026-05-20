import type { SessionData } from "@auth0/nextjs-auth0/types";
import { sessionHasAdminRole } from "@/lib/auth0-admin";
import { sessionHasPartnerRole } from "@/lib/auth0-partner";
import { userSubToPathSegment } from "@/lib/user-sub-path";

export type SocialFeedNavProps = {
  homeHref: string;
  myVideosHref: string;
  studioHref: string;
  partnerProfileHref?: string;
  adminRegionsHref?: string;
  showPartnerNav: boolean;
  showAdminNav: boolean;
};

export async function getSocialFeedNavProps(
  session: SessionData,
): Promise<SocialFeedNavProps> {
  const prefix = `/${userSubToPathSegment(session.user.sub)}`;
  const [showPartnerNav, showAdminNav] = await Promise.all([
    sessionHasPartnerRole(session),
    sessionHasAdminRole(session),
  ]);
  return {
    homeHref: prefix,
    myVideosHref: `${prefix}/my-videos`,
    studioHref: `${prefix}/studio`,
    partnerProfileHref: showPartnerNav ? `${prefix}/partner/profile` : undefined,
    adminRegionsHref: showAdminNav ? `${prefix}/admin/regions` : undefined,
    showPartnerNav,
    showAdminNav,
  };
}
