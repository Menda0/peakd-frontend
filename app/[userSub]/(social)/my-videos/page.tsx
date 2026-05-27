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
      <header className="border-b border-border px-4 pb-3 pt-4 sm:mb-6 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0">
        <h1 className="text-lg font-semibold text-foreground sm:text-xl">My videos</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Your waves — personal uploads (auto-claimed) and partner clips you have claimed.
        </p>
      </header>
      <MyVideosPanel />
    </SocialFeedLayout>
  );
}
