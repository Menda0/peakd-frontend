import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { sessionHasAdminRole } from "@/lib/auth0-admin";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { AdminRegionEdit } from "@/components/admin/admin-region-edit";

export default async function AdminRegionEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ userSub: string; regionId: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { regionId } = await params;
  const { country } = await searchParams;
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const prefix = `/${userSubToPathSegment(session.user.sub)}`;
  const isAdmin = await sessionHasAdminRole(session);
  if (!isAdmin) {
    redirect(prefix);
  }

  const nav = await getSocialFeedNavProps(session);
  const regionsBasePath = `${prefix}/admin/regions`;
  const countryQ =
    typeof country === "string" && country.trim()
      ? `?country=${encodeURIComponent(country.trim().toUpperCase())}`
      : "";
  const regionsListHref = `${regionsBasePath}${countryQ}`;

  return (
    <SocialFeedLayout
      {...nav}
      adminRegionsHref={`${regionsBasePath}`}
      adminPeaksHref={`${prefix}/admin/peaks`}
      showAdminNav
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <AdminRegionEdit regionId={regionId} regionsListHref={regionsListHref} />
    </SocialFeedLayout>
  );
}
