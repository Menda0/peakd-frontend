import { auth0 } from "@/lib/auth0";
import { sessionHasPartnerRole } from "@/lib/auth0-partner";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { StudioJobDetail } from "@/components/studio/studio-job-detail";

export default async function StudioJobPage({
  params,
}: {
  params: Promise<{ userSub: string; jobId: string }>;
}) {
  await params;
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const prefix = `/${userSubToPathSegment(session.user.sub)}`;
  const showPartnerNav = sessionHasPartnerRole(session);

  return (
    <SocialFeedLayout
      homeHref={prefix}
      studioHref={`${prefix}/studio`}
      showPartnerNav={showPartnerNav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <StudioJobDetail />
    </SocialFeedLayout>
  );
}
