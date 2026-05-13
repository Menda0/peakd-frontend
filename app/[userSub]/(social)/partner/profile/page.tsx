import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { sessionHasPartnerRole } from "@/lib/auth0-partner";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { PartnerProfileForm } from "@/components/partner/partner-profile-form";
import { getPartnerProfileAction } from "./actions";

export default async function PartnerProfilePage({
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
  const isPartner = await sessionHasPartnerRole(session);
  if (!isPartner) {
    redirect(prefix);
  }

  const defaultPartnerName =
    session.user.name && session.user.name.trim() !== "" ? session.user.name : session.user.email ?? "";

  const initialProfile = await getPartnerProfileAction();

  return (
    <SocialFeedLayout
      homeHref={prefix}
      studioHref={`${prefix}/studio`}
      partnerProfileHref={`${prefix}/partner/profile`}
      showPartnerNav
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <PartnerProfileForm
        defaultPartnerName={defaultPartnerName}
        fallbackUserPicture={session.user.picture}
        initialProfile={initialProfile}
      />
    </SocialFeedLayout>
  );
}
