"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, UploadIcon } from "lucide-react";
import { AdminNav } from "@/components/social-feed/admin-nav";
import { FeedUserMenu } from "@/components/social-feed/feed-user-menu";
import { MainNav } from "@/components/social-feed/main-nav";
import { PartnerNav } from "@/components/social-feed/partner-nav";
import { UploadVideoModal } from "@/components/social-feed/upload-video-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  resolveAdminNavItems,
  resolveMainNavItems,
  resolvePartnerNavItems,
} from "@/lib/social-feed-nav-routes";

export function FeedMobileMenu({
  homeHref,
  myVideosHref,
  studioHref,
  partnerProfileHref,
  partnerIncomeHref,
  adminRegionsHref,
  adminSalesHref,
  adminFinanceHref,
  showPartnerNav,
  showAdminNav,
  userPicture,
  userName,
  userEmail,
}: {
  homeHref: string;
  myVideosHref: string;
  studioHref: string;
  partnerProfileHref?: string;
  partnerIncomeHref?: string;
  adminRegionsHref?: string;
  adminSalesHref?: string;
  adminFinanceHref?: string;
  showPartnerNav: boolean;
  showAdminNav: boolean;
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const mainItems = resolveMainNavItems(pathname, {
    homeHref,
    myVideosHref,
    studioHref,
    showPartnerNav,
  });
  const partnerItems = resolvePartnerNavItems(pathname, {
    studioHref,
    partnerProfileHref,
    partnerIncomeHref,
  });
  const adminItems = resolveAdminNavItems(pathname, {
    adminRegionsHref,
    adminSalesHref,
    adminFinanceHref,
  });

  return (
    <>
      <UploadVideoModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open menu"
            />
          }
        >
          <MenuIcon className="size-5" aria-hidden />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex h-full w-[min(100vw-2rem,18rem)] flex-col p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-base">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-6 px-4 py-4">
              <MainNav items={mainItems} />
              {showPartnerNav ? <PartnerNav items={partnerItems} /> : null}
              {showAdminNav ? <AdminNav items={adminItems} /> : null}
            </div>
            <Separator />
            <div className="flex flex-col gap-3 px-4 py-4">
              <Button
                type="button"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setUploadOpen(true);
                  setOpen(false);
                }}
              >
                <UploadIcon className="size-4" aria-hidden />
                Upload video
              </Button>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
            <div className="mt-auto border-t border-border px-3 py-3">
              <FeedUserMenu
                userPicture={userPicture}
                userName={userName}
                userEmail={userEmail}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
