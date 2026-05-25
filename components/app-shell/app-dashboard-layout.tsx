"use client";

import Link from "next/link";
import { PeakdLogo } from "@/components/peakd-logo";
import { usePathname } from "next/navigation";
import type { User } from "@auth0/nextjs-auth0/types";
import { ClapperboardIcon, HomeIcon, LayoutGridIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppUser = Pick<User, "sub" | "name" | "email" | "picture">;

export function AppDashboardLayout({
  userPathPrefix,
  user,
  children,
}: {
  userPathPrefix: string;
  user: AppUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const afterSub = segments.slice(1);
  const onStudio = afterSub[0] === "studio";
  const jobId = onStudio && afterSub[1] ? afterSub[1] : null;

  const initials =
    (user.name?.trim()?.charAt(0) ?? user.email?.trim()?.charAt(0) ?? "?").toUpperCase();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-3">
          <Link
            href={userPathPrefix}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <LayoutGridIcon className="size-4 shrink-0 opacity-80" aria-hidden />
            Peakd
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            nativeButton={false}
            render={<Link href={userPathPrefix} />}
          >
            <HomeIcon className="size-4 shrink-0 opacity-80" aria-hidden />
            Home
          </Button>
          <Button
            variant={onStudio && !jobId ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            nativeButton={false}
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            <ClapperboardIcon className="size-4 shrink-0 opacity-80" aria-hidden />
            Studio
          </Button>
        </nav>
        <div className="border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "h-auto min-h-12 w-full justify-start gap-2 py-2 px-2 font-normal",
              )}
            >
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Auth0 avatar URL
                <img
                  src={user.picture}
                  alt=""
                  className="size-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {initials}
                </span>
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium leading-tight">
                  {user.name ?? "Account"}
                </span>
                {user.email ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{user.name ?? "Signed in"}</span>
                    {user.email ? (
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link href="/auth/logout" prefetch={false} className="w-full cursor-pointer" />
                  }
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
          <Link href={userPathPrefix} className="flex shrink-0 items-center gap-2">
            <PeakdLogo className="h-7" priority />
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="min-w-0 flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={`${userPathPrefix}/studio`} />}
                    className="max-w-[140px] truncate"
                  >
                    Workspace
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {onStudio ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {jobId ? (
                        <BreadcrumbLink
                          render={<Link href={`${userPathPrefix}/studio`} />}
                        >
                          Studio
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>Studio</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </>
                ) : null}
                {jobId ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="max-w-[200px] truncate font-mono text-xs">
                        {jobId}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/auth/logout" prefetch={false} />}>
              Log out
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
