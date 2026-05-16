import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { pathSegmentMatchesUserSub, userSubToPathSegment } from "@/lib/user-sub-path";
import { UserProfileProvider } from "@/components/user-profile/user-profile-provider";

export default async function UserScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userSub: string }>;
}) {
  const { userSub } = await params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    const returnTo = encodeURIComponent(`/${userSub}`);
    redirect(`/auth/login?returnTo=${returnTo}`);
  }

  if (!pathSegmentMatchesUserSub(userSub, session.user.sub)) {
    redirect(`/${userSubToPathSegment(session.user.sub)}`);
  }

  const u = session.user;
  const givenName =
    u && typeof u === "object" && "given_name" in u && typeof (u as { given_name?: unknown }).given_name === "string"
      ? (u as { given_name: string }).given_name
      : undefined;

  return (
    <UserProfileProvider
      auth0User={{
        name: u.name ?? undefined,
        given_name: givenName,
        email: u.email ?? undefined,
        picture:
          u && typeof u === "object" && "picture" in u && typeof (u as { picture?: unknown }).picture === "string"
            ? (u as { picture: string }).picture
            : undefined,
      }}
    >
      {children}
    </UserProfileProvider>
  );
}
