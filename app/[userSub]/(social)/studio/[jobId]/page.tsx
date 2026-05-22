import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";
import { StudioJobDetail } from "@/components/studio/studio-job-detail";

export default async function StudioJobPage({
  params,
}: {
  params: Promise<{ userSub: string; jobId: string }>;
}) {
  const { userSub, jobId } = await params;
  if (jobId === "sessions") {
    redirect(`/${userSubToPathSegment(userSub)}/studio`);
  }
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
      <StudioJobDetail />
    </SocialFeedLayout>
  );
}
