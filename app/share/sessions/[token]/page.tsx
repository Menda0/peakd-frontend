import { FeedAppBar } from "@/components/social-feed/feed-app-bar";
import { SharedSessionView } from "@/components/share/shared-session-view";
import { auth0 } from "@/lib/auth0";
import { enrichSharedSessionViewData } from "@/lib/format-datetime";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { fetchPublicSharedSession } from "@/lib/shared-session";

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data;
  try {
    data = await fetchPublicSharedSession(token);
  } catch {
    return (
      <main className="min-h-screen bg-[#050a0f] text-zinc-100">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This shared session could not be loaded. Try again later.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#050a0f] text-zinc-100">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Session not found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This link may be invalid or sharing was removed.
          </p>
        </div>
      </main>
    );
  }

  const session = await auth0.getSession();
  const nav = session?.user?.sub
    ? await getSocialFeedNavProps(session)
    : {
        homeHref: "/",
        myVideosHref: "/",
        studioHref: "/",
        showPartnerNav: false,
        showAdminNav: false,
      };

  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-[#040F1E] text-zinc-100">
      <FeedAppBar
        homeHref={nav.homeHref}
        userPicture={session?.user?.picture}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
      />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <SharedSessionView
          data={enrichSharedSessionViewData(data)}
          shareToken={token}
        />
      </main>
    </div>
  );
}
