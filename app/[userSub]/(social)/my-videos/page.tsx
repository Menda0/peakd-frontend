import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { MyVideosPanel } from "@/components/social-feed/my-videos-panel";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";

export default async function MyVideosPage({
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

  return (
    <SocialFeedLayout
      {...nav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-foreground">My videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your waves — personal uploads (auto-claimed) and partner clips you have claimed.
        </p>
      </header>
      <MyVideosPanel />
    </SocialFeedLayout>
  );
}
