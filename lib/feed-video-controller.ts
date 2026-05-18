/** Feed video playback: one active clip, centered in the scroll viewport. */

const MIN_VISIBLE_RATIO = 0.4;

type FeedVideoEntry = {
  id: string;
  el: HTMLElement;
  play: () => void;
  pause: () => void;
  isUserPaused: () => boolean;
  onActiveChange?: (active: boolean) => void;
};

const entries = new Map<string, FeedVideoEntry>();
let scrollRoot: HTMLElement | null = null;
let scrollListenerAttached = false;
let activeId: string | null = null;
let rafId: number | null = null;

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

  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const [id, entry] of entries) {
    const rect = entry.el.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, viewportTop);
    const visibleBottom = Math.min(rect.bottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

    if (visibleRatio < MIN_VISIBLE_RATIO) continue;

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

function attachScrollListeners(root: HTMLElement) {
  if (scrollListenerAttached && scrollRoot === root) return;

  if (scrollRoot && scrollRoot !== root) {
    scrollRoot.removeEventListener("scroll", schedulePickActive);
  }

  scrollRoot = root;
  scrollRoot.addEventListener("scroll", schedulePickActive, { passive: true });
  window.addEventListener("resize", schedulePickActive, { passive: true });
  scrollListenerAttached = true;
}

export function registerFeedVideo(entry: FeedVideoEntry): void {
  entries.set(entry.id, entry);
  attachScrollListeners(findScrollParent(entry.el));
  schedulePickActive();
}

export function unregisterFeedVideo(id: string): void {
  entries.delete(id);
  if (activeId === id) {
    activeId = null;
  }
  if (entries.size === 0) {
    scrollRoot?.removeEventListener("scroll", schedulePickActive);
    window.removeEventListener("resize", schedulePickActive);
    scrollRoot = null;
    scrollListenerAttached = false;
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
