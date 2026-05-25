/** Single overlay CTA on media (Claim only). Sits on dark video, so text stays white in both themes. */
export const waveOverlayButtonClassName =
  "absolute bottom-3 right-3 z-10 h-auto rounded-lg border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-black/85";

/** Container when multiple overlay CTAs stack on media. */
export const waveOverlayStackClassName =
  "absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2";

/** Button inside overlay stack (no absolute positioning). Sits on dark video, so text stays white in both themes. */
export const waveOverlayStackItemClassName =
  "h-auto rounded-lg border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-black/85";
