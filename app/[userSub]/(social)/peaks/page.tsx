import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { PeaksCheckoutResult } from "@/components/peaks/peaks-checkout-result";

export default async function PeaksPage({
  params,
  searchParams,
}: {
  params: Promise<{ userSub: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  await params;
  const { checkout } = await searchParams;
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const nav = await getSocialFeedNavProps(session);
  const checkoutStatus =
    checkout === "success" ? "success" : checkout === "cancel" ? "cancel" : null;

  return (
    <SocialFeedLayout
      {...nav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <PeaksCheckoutResult status={checkoutStatus} homeHref={nav.homeHref} />
    </SocialFeedLayout>
  );
}
