import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { pathSegmentMatchesUserSub, userSubToPathSegment } from "@/lib/user-sub-path";

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

  return <>{children}</>;
}
