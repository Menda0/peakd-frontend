import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { userSubToPathSegment } from "@/lib/user-sub-path";

export default async function HomePage() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    redirect("/auth/login?returnTo=%2F");
  }
  redirect(`/${userSubToPathSegment(session.user.sub)}`);
}
