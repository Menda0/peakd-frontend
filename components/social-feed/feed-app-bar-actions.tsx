"use client";

import { useState } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  LogOut,
  MessageCircleIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadVideoModal } from "@/components/social-feed/upload-video-modal";
import { PeaksBalanceBar } from "@/components/peaks/peaks-balance-bar";
import { useUserProfileModal } from "@/components/user-profile/user-profile-provider";
import { englishCountryLabel } from "@/lib/countries";
import { auth0DisplayNameHint } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

function initialsFromDisplayName(displayName: string, email: string | null | undefined) {
  const d = displayName.trim();
  if (d) {
    const parts = d.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
    }
    return d.charAt(0).toUpperCase();
  }
  const e = typeof email === "string" ? email.trim() : "";
  return e ? e.charAt(0).toUpperCase() : "?";
}

export function FeedAppBarActions({
  userPicture,
  userName,
  userEmail,
}: {
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const { openProfileSettings, profile, auth0User } = useUserProfileModal();
  const [uploadOpen, setUploadOpen] = useState(false);

  const displayName =
    profile?.displayName?.trim() ||
    profile?.nickname?.trim() ||
    userName?.trim() ||
    auth0DisplayNameHint(auth0User) ||
    "";

  const email = userEmail?.trim() || auth0User.email?.trim() || null;

  const avatarImageUrl =
    profile?.avatarUrl?.trim() ||
    userPicture?.trim() ||
    auth0User.picture?.trim() ||
    null;

  const countryLabel = englishCountryLabel(profile?.countryCode ?? null);

  const initials = initialsFromDisplayName(displayName, email);

  return (
    <>
      <UploadVideoModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <PeaksBalanceBar />
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-[#26c2c9] px-4 py-2 text-sm font-medium text-[#040A10] transition hover:bg-[#2dd4dc]"
        onClick={() => setUploadOpen(true)}
      >
        <UploadIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">Upload</span>
      </button>
      <button
        type="button"
        className="rounded-full p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
        aria-label="Messages"
      >
        <MessageCircleIcon className="size-5" />
      </button>
      <button
        type="button"
        className="rounded-full p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
        aria-label="Notifications"
      >
        <BellIcon className="size-5" />
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          type="button"
          className={cn(
            "group flex h-10 max-w-[min(22rem,calc(100vw-10rem))] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-zinc-800 py-1 pl-1 pr-2 outline-none ring-offset-2 ring-offset-[#040F1E] focus-visible:ring-2 focus-visible:ring-[#26c2c9]/60 data-[popup-open]:border-white/25 data-[popup-open]:bg-zinc-800/90",
            "min-w-0",
          )}
          aria-label="Account menu"
        >
          <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-zinc-900">
            {avatarImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Auth0 / S3 URL
              <img src={avatarImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-semibold tracking-tight text-zinc-200">
                {initials}
              </span>
            )}
          </span>
          <div className="flex min-w-0 max-w-[5.5rem] flex-1 flex-col items-start text-left sm:max-w-[14rem]">
            <span className="w-full truncate text-sm font-medium leading-tight text-zinc-50">
              {displayName || "Signed in"}
            </span>
            {countryLabel ? (
              <span className="w-full truncate text-xs leading-tight text-zinc-500">{countryLabel}</span>
            ) : null}
          </div>
          <ChevronDownIcon
            className="size-4 shrink-0 text-zinc-400 transition group-data-[popup-open]:rotate-180 group-data-[popup-open]:text-zinc-200"
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="z-[100] min-w-52 border-white/10 bg-[#0a1218] p-1 text-zinc-100 shadow-lg ring-1 ring-white/10"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 font-normal text-zinc-300">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-zinc-50">
                  {displayName || "Signed in"}
                </span>
                {email ? <span className="truncate text-xs text-zinc-500">{email}</span> : null}
                {countryLabel ? (
                  <span className="truncate text-xs text-zinc-400">{countryLabel}</span>
                ) : null}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer text-zinc-200 focus:bg-white/10 focus:text-zinc-50"
              onClick={() => {
                void openProfileSettings().catch(() => {});
              }}
            >
              <UserIcon className="size-4 opacity-80" aria-hidden />
              Edit profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-zinc-200 focus:bg-white/10 focus:text-zinc-50"
              onClick={() => {
                window.location.assign("/auth/logout");
              }}
            >
              <LogOut className="size-4 opacity-80" aria-hidden />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    </>
  );
}
