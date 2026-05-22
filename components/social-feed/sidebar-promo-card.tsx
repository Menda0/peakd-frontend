import Link from "next/link";

export function SidebarPromoCard({ studioHref }: { studioHref: string }) {
  return (
    <div className="mt-auto overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/80 via-[#040F1E] to-[#040F1E] p-4">
      <div
        className="mb-3 h-20 rounded-xl bg-gradient-to-r from-primary/30 via-blue-900/40 to-zinc-900"
        aria-hidden
      />
      <p className="text-sm font-semibold leading-snug text-zinc-100">
        Share your wave. Inspire the world.
      </p>
      <Link
        href={studioHref}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Upload Video
      </Link>
    </div>
  );
}
