import type { ReactNode } from "react";
import { VideoFeed } from "@/components/VideoFeed";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-200 dark:bg-zinc-950 md:items-center md:justify-center md:p-4">
      <div className="flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background md:h-[min(100dvh,820px)] md:rounded-2xl md:border md:border-zinc-200 md:shadow-xl dark:md:border-zinc-800">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-zinc-800/80">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Peakd
            </h1>
            <span className="hidden text-xs font-medium text-zinc-500 sm:inline dark:text-zinc-400">
              Surf feed
            </span>
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            For you
          </span>
        </header>

        <VideoFeed />

        <nav
          className="flex shrink-0 items-stretch justify-around border-t border-zinc-200/80 bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 dark:border-zinc-800/80"
          aria-label="Primary"
        >
          <NavItem active label="Feed" icon={<WaveIcon />} />
          <NavItem label="Discover" icon={<CompassIcon />} />
          <NavItem label="Profile" icon={<UserIcon />} />
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-11 min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors ${
        active
          ? "text-foreground"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className={active ? "text-sky-600 dark:text-sky-400" : ""}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function WaveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-6"
      aria-hidden
    >
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 017.92 12.446 19.05 19.05 0 01-4.516 3.753 2.25 2.25 0 01-2.823 0 19.047 19.047 0 01-4.519-3.752 7.5 7.5 0 017.921-12.447z" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="size-6"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 12l4-6-6 4-4 6 6-4z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-6"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
        clipRule="evenodd"
      />
    </svg>
  );
}
