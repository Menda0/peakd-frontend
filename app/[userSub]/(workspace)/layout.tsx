import type { ReactNode } from "react";
import { auth0 } from "@/lib/auth0";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { AppDashboardLayout } from "@/components/app-shell/app-dashboard-layout";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const userPathPrefix = `/${userSubToPathSegment(session.user.sub)}`;

  return (
    <AppDashboardLayout userPathPrefix={userPathPrefix} user={session.user}>
      {children}
    </AppDashboardLayout>
  );
}
