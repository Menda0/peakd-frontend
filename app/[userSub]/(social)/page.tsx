import { auth0 } from "@/lib/auth0";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";

export default async function SocialHomePage({
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

  return (
    <SocialFeedLayout
      homeHref={prefix}
      uploadHref={`${prefix}/videographer`}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    />
  );
}
