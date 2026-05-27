"use client";

import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { FeedMobileMenu } from "@/components/social-feed/feed-mobile-menu";
import { UploadVideoModal } from "@/components/social-feed/upload-video-modal";
import { PeaksBalanceBar } from "@/components/peaks/peaks-balance-bar";
import { WaveUnlockCartButton } from "@/components/social-feed/wave-unlock-cart-button";
import { ThemeToggle } from "@/components/theme-toggle";

export type FeedAppBarActionsProps = {
  mobileMenu?: {
    homeHref: string;
    myVideosHref: string;
    studioHref: string;
    partnerProfileHref?: string;
    partnerIncomeHref?: string;
    adminRegionsHref?: string;
    adminPeaksHref?: string;
    adminFinanceHref?: string;
    showPartnerNav: boolean;
    showAdminNav: boolean;
    userPicture?: string | null;
    userName?: string | null;
    userEmail?: string | null;
  };
};

export function FeedAppBarActions({ mobileMenu }: FeedAppBarActionsProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <UploadVideoModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
        <WaveUnlockCartButton />
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          <PeaksBalanceBar />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            onClick={() => setUploadOpen(true)}
          >
            <UploadIcon className="size-4" aria-hidden />
            <span>Upload</span>
          </button>
          <ThemeToggle />
        </div>
        {mobileMenu ? <FeedMobileMenu {...mobileMenu} /> : null}
      </div>
    </>
  );
}
