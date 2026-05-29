import { FeedAppBar } from "@/components/social-feed/feed-app-bar";
import { PublicProfileView } from "@/components/profile/public-profile-view";
import { ShareBackButton } from "@/components/share/share-back-button";
import { auth0 } from "@/lib/auth0";
import { fetchPublicProfile } from "@/lib/public-profile";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  let profile;
  try {
    profile = await fetchPublicProfile(handle);
  } catch {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="flex justify-start">
            <ShareBackButton />
          </div>
          <h1 className="mt-6 text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This profile could not be loaded. Try again later.
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="flex justify-start">
            <ShareBackButton />
          </div>
          <h1 className="mt-6 text-xl font-semibold">Profile not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This handle may be invalid or the profile is not set up yet.
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
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <FeedAppBar
        homeHref={nav.homeHref}
        mobileMenu={{
          homeHref: nav.homeHref,
          myVideosHref: nav.myVideosHref,
          studioHref: nav.studioHref,
          partnerProfileHref: nav.partnerProfileHref,
          partnerIncomeHref: nav.partnerIncomeHref,
          adminRegionsHref: nav.adminRegionsHref,
          adminSalesHref: nav.adminSalesHref,
          showPartnerNav: nav.showPartnerNav,
          showAdminNav: nav.showAdminNav,
        }}
      />
      <main className="min-h-0 flex-1 overflow-y-auto px-0 py-8 sm:px-6 sm:py-6">
        <PublicProfileView profile={profile} />
      </main>
    </div>
  );
}
