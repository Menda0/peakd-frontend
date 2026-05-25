"use client";

import { ChevronUpIcon, LogOut, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserProfileModal } from "@/components/user-profile/user-profile-provider";
import { englishCountryLabel } from "@/lib/countries";
import { auth0DisplayNameHint } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

function initialsFromDisplayName(
  displayName: string,
  email: string | null | undefined,
) {
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

export function FeedUserMenu({
  userPicture,
  userName,
  userEmail,
}: {
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const { openProfileSettings, profile, auth0User } = useUserProfileModal();

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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          "group flex w-full items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-2 py-1.5 text-left outline-none transition",
          "hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
          "data-[popup-open]:bg-sidebar-accent",
        )}
        aria-label="Account menu"
      >
        <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-sidebar">
          {avatarImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Auth0 / S3 URL
            <img
              src={avatarImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-semibold tracking-tight text-sidebar-foreground">
              {initials}
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
            {displayName || "Signed in"}
          </span>
          {email || countryLabel ? (
            <span className="truncate text-xs leading-tight text-muted-foreground">
              {email ?? countryLabel}
            </span>
          ) : null}
        </div>
        <ChevronUpIcon
          className="size-4 shrink-0 text-muted-foreground transition group-data-[popup-open]:rotate-180 group-data-[popup-open]:text-sidebar-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="z-[100] min-w-52 border-border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 font-normal text-muted-foreground">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {displayName || "Signed in"}
              </span>
              {email ? (
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              ) : null}
              {countryLabel ? (
                <span className="truncate text-xs text-muted-foreground">
                  {countryLabel}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
            onClick={() => {
              void openProfileSettings().catch(() => {});
            }}
          >
            <UserIcon className="size-4 opacity-80" aria-hidden />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-foreground focus:bg-accent focus:text-foreground"
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
  );
}
