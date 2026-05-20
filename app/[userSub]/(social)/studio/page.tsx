import { getPartnerProfileAction } from "@/app/[userSub]/(social)/partner/profile/actions";
import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { StudioSessionsDashboard } from "@/components/studio/studio-sessions-dashboard";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ userSub: string }>;
}) {
  await params;
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const nav = await getSocialFeedNavProps(session);

  let defaultCountryCode: string | null = null;
  let partnerCommercialDefaults = null;
  if (nav.showPartnerNav) {
    const profileRes = await getPartnerProfileAction();
    if (profileRes.ok) {
      const cc = profileRes.data.countryCode?.trim().toUpperCase();
      if (cc && /^[A-Z]{2}$/.test(cc)) {
        defaultCountryCode = cc;
      }
      partnerCommercialDefaults = profileRes.data.commercialSettings;
    }
  }

  return (
    <SocialFeedLayout
      {...nav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <StudioSessionsDashboard
        defaultCountryCode={defaultCountryCode}
        showCommercialFields={nav.showPartnerNav}
        partnerCommercialDefaults={partnerCommercialDefaults}
      />
    </SocialFeedLayout>
  );
}
