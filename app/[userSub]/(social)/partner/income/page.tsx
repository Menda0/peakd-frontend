import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { sessionHasPartnerRole } from "@/lib/auth0-partner";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { PartnerIncomeDashboard } from "@/components/partner/partner-income-dashboard";
import {
  getPartnerPayoutsStatusAction,
  listPartnerEarningsAction,
} from "./actions";

export default async function PartnerIncomePage({
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

  const [initialStatus, initialEarnings, nav] = await Promise.all([
    getPartnerPayoutsStatusAction(),
    listPartnerEarningsAction({ limit: 20 }),
    getSocialFeedNavProps(session),
  ]);

  return (
    <SocialFeedLayout
      {...nav}
      partnerProfileHref={`${prefix}/partner/profile`}
      partnerIncomeHref={`${prefix}/partner/income`}
      showPartnerNav
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <PartnerIncomeDashboard
        initialStatus={initialStatus}
        initialEarnings={initialEarnings}
      />
    </SocialFeedLayout>
  );
}
