import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { StudioSessionFolder } from "@/components/studio/studio-session-folder";

export default async function StudioSessionPage({
  params,
}: {
  params: Promise<{ userSub: string; sessionId: string }>;
}) {
  await params;
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const nav = await getSocialFeedNavProps(session);

  return (
    <SocialFeedLayout
      {...nav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <StudioSessionFolder />
    </SocialFeedLayout>
  );
}
