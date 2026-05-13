import Link from "next/link";

export function SidebarPromoCard({ uploadHref }: { uploadHref: string }) {
  return (
    <div className="mt-auto overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/80 via-[#050a0f] to-[#050a0f] p-4">
      <div
        className="mb-3 h-20 rounded-xl bg-gradient-to-r from-[#26c2c9]/30 via-blue-900/40 to-zinc-900"
        aria-hidden
      />
      <p className="text-sm font-semibold leading-snug text-zinc-100">
        Share your wave. Inspire the world.
      </p>
      <Link
        href={uploadHref}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#26c2c9] py-2.5 text-sm font-semibold text-[#050a0f] transition hover:bg-[#2dd4dc]"
      >
        Upload Video
      </Link>
    </div>
  );
}
