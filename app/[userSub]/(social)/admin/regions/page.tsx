import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { sessionHasAdminRole } from "@/lib/auth0-admin";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { AdminRegionsManager } from "@/components/admin/admin-regions-manager";

export default async function AdminRegionsPage({
  params,
}: {
  params: Promise<{ userSub: string }>;
}) {
  await params;
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

  return (
    <SocialFeedLayout
      {...nav}
      adminRegionsHref={`${prefix}/admin/regions`}
      adminPeaksHref={`${prefix}/admin/peaks`}
      adminFinanceHref={`${prefix}/admin/finance`}
      showAdminNav
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading regions…</p>}>
        <AdminRegionsManager regionsBasePath={`${prefix}/admin/regions`} />
      </Suspense>
    </SocialFeedLayout>
  );
}
