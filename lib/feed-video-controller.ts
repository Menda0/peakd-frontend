/** Feed video playback: one active clip, centered in the scroll viewport. */

const MIN_VISIBLE_RATIO_DESKTOP = 0.4;
const MIN_VISIBLE_RATIO_TOUCH = 0.25;

type FeedVideoEntry = {
  id: string;
  el: HTMLElement;
  play: () => void;
  pause: () => void;
  isUserPaused: () => boolean;
  onActiveChange?: (active: boolean) => void;
};

const entries = new Map<string, FeedVideoEntry>();
const intersectionRatios = new Map<string, number>();
let scrollRoot: HTMLElement | null = null;
let scrollListenerAttached = false;
let scrollEndListenerAttached = false;
let intersectionObserver: IntersectionObserver | null = null;
let observedRoot: HTMLElement | null = null;
let activeId: string | null = null;
let rafId: number | null = null;

function isTouchLikeDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function minVisibleRatio(): number {
  return isTouchLikeDevice()
    ? MIN_VISIBLE_RATIO_TOUCH
    : MIN_VISIBLE_RATIO_DESKTOP;
}

function findScrollParent(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return document.documentElement;
}

function getViewportMetrics(root: HTMLElement) {
  if (root === document.documentElement) {
    return { top: 0, height: window.innerHeight };
  }
  const rect = root.getBoundingClientRect();
  return { top: rect.top, height: rect.height };
}

function visibleRatioForEntry(
  id: string,
  entry: FeedVideoEntry,
  viewportTop: number,
  viewportBottom: number,
): number {
  const fromObserver = intersectionRatios.get(id);
  if (fromObserver != null) {
    return fromObserver;
  }
  const rect = entry.el.getBoundingClientRect();
  const visibleTop = Math.max(rect.top, viewportTop);
  const visibleBottom = Math.min(rect.bottom, viewportBottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return rect.height > 0 ? visibleHeight / rect.height : 0;
}

function schedulePickActive() {
  if (rafId != null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    pickActiveVideo();
  });
}

function pickActiveVideo() {
  if (entries.size === 0) return;

  const root = scrollRoot ?? document.documentElement;
  const { top: viewportTop, height: viewportHeight } = getViewportMetrics(root);
  const viewportCenter = viewportTop + viewportHeight / 2;
  const viewportBottom = viewportTop + viewportHeight;
  const minRatio = minVisibleRatio();

  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const [id, entry] of entries) {
    const visibleRatio = visibleRatioForEntry(
      id,
      entry,
      viewportTop,
      viewportBottom,
    );

    if (visibleRatio < minRatio) continue;

    const rect = entry.el.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const centerDistance = Math.abs(elementCenter - viewportCenter);
    const score = visibleRatio * 1000 - centerDistance;

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  for (const [id, entry] of entries) {
    const shouldBeActive = id === bestId;
    entry.onActiveChange?.(shouldBeActive);

    if (shouldBeActive) {
      if (activeId !== id) {
        pauseActive();
        activeId = id;
      }
      if (!entry.isUserPaused()) {
        entry.play();
      }
    } else {
      entry.pause();
    }
  }

  if (!bestId) {
    for (const entry of entries.values()) {
      entry.onActiveChange?.(false);
    }
    if (activeId) {
      pauseActive();
      activeId = null;
    }
  }
}

function pauseActive() {
  if (!activeId) return;
  const entry = entries.get(activeId);
  entry?.pause();
}

function teardownScrollListeners() {
  scrollRoot?.removeEventListener("scroll", schedulePickActive);
  if (scrollEndListenerAttached) {
    scrollRoot?.removeEventListener("scrollend", schedulePickActive);
    scrollEndListenerAttached = false;
  }
  window.removeEventListener("resize", schedulePickActive);
  scrollRoot = null;
  scrollListenerAttached = false;
}

function teardownIntersectionObserver() {
  intersectionObserver?.disconnect();
  intersectionObserver = null;
  observedRoot = null;
  intersectionRatios.clear();
}

function ensureIntersectionObserver(root: HTMLElement) {
  if (intersectionObserver && observedRoot === root) {
    return;
  }

  teardownIntersectionObserver();
  observedRoot = root;
  const rootOption = root === document.documentElement ? null : root;

  intersectionObserver = new IntersectionObserver(
    (observerEntries) => {
      for (const record of observerEntries) {
        const id = (record.target as HTMLElement).dataset.feedVideoId;
        if (!id) continue;
        intersectionRatios.set(id, record.intersectionRatio);
      }
      schedulePickActive();
    },
    {
      root: rootOption,
      threshold: [0, 0.1, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
    },
  );

  for (const [id, entry] of entries) {
    entry.el.dataset.feedVideoId = id;
    intersectionObserver.observe(entry.el);
  }
}

function attachScrollListeners(root: HTMLElement) {
  const rootChanged = scrollRoot !== root;

  if (scrollListenerAttached && !rootChanged) return;

  if (scrollRoot && rootChanged) {
    teardownScrollListeners();
  }

  scrollRoot = root;
  scrollRoot.addEventListener("scroll", schedulePickActive, { passive: true });
  if ("onscrollend" in scrollRoot) {
    scrollRoot.addEventListener("scrollend", schedulePickActive, { passive: true });
    scrollEndListenerAttached = true;
  }
  window.addEventListener("resize", schedulePickActive, { passive: true });
  scrollListenerAttached = true;

  ensureIntersectionObserver(root);
}

export function registerFeedVideo(entry: FeedVideoEntry): void {
  entries.set(entry.id, entry);
  entry.el.dataset.feedVideoId = entry.id;
  const root = findScrollParent(entry.el);
  const hadObserver = intersectionObserver != null && observedRoot === root;
  attachScrollListeners(root);
  if (hadObserver) {
    intersectionObserver?.observe(entry.el);
  }
  schedulePickActive();
}

export function unregisterFeedVideo(id: string): void {
  const entry = entries.get(id);
  if (entry && intersectionObserver) {
    intersectionObserver.unobserve(entry.el);
    delete entry.el.dataset.feedVideoId;
  }
  intersectionRatios.delete(id);
  entries.delete(id);
  if (activeId === id) {
    activeId = null;
  }
  if (entries.size === 0) {
    teardownScrollListeners();
    teardownIntersectionObserver();
  }
}

export function getActiveFeedVideoId(): string | null {
  return activeId;
}

export function notifyFeedVideoInteraction(): void {
  schedulePickActive();
}

/** User tapped play — prioritize this clip until scroll recenters. */
export function forceActiveFeedVideo(id: string): void {
  const entry = entries.get(id);
  if (!entry) return;

  for (const [otherId, other] of entries) {
    if (otherId !== id) {
      other.pause();
    }
    other.onActiveChange?.(otherId === id);
  }

  activeId = id;
  entry.play();
}

/** Fine scrub step per arrow key press (seconds). */
const SEEK_SECONDS = 0.25;

export function seekActiveFeedVideo(direction: "back" | "forward"): boolean {
  if (!activeId) return false;
  const entry = entries.get(activeId);
  if (!entry) return false;

  const video = entry.el.querySelector("video");
  if (!video || !Number.isFinite(video.duration)) return false;

  const delta = direction === "back" ? -SEEK_SECONDS : SEEK_SECONDS;
  video.currentTime = Math.max(
    0,
    Math.min(video.duration, video.currentTime + delta),
  );
  return true;
}
