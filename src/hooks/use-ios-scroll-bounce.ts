import { useEffect } from "react";

type Options = {
  /**
   * Keeps iOS system gestures (like swipe-back from the left edge) working by not preventing
   * predominantly horizontal gestures.
   */
  preserveHorizontalGestures?: boolean;
  /**
   * Left-edge threshold (px) treated as a system gesture zone.
   */
  leftEdgePx?: number;
};

const defaultOptions: Required<Options> = {
  preserveHorizontalGestures: true,
  leftEdgePx: 24,
};

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);

  // iPadOS can masquerade as Mac
  const iPadOS = navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;

  return iOS || iPadOS;
}

/**
 * Prevents the iOS "rubber-band" / scroll-chaining effect for a specific scroll container.
 * This stops the whole page from bouncing (which makes fixed headers/footers appear to move),
 * while keeping normal scrolling and horizontal swipe gestures working.
 */
export function usePreventIOSScrollBounce<T extends HTMLElement>(
  scrollRef: React.RefObject<T | null>,
  options?: Options
) {
  useEffect(() => {
    if (!isIOSDevice()) return;

    const el = scrollRef.current;
    if (!el) return;

    const opts = { ...defaultOptions, ...(options || {}) };

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Let horizontal gestures (swipe-back, swipe actions) pass through.
      if (opts.preserveHorizontalGestures) {
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        if (isHorizontal) return;

        // Extra allowance for iOS back gesture from the very left edge.
        if (startX <= opts.leftEdgePx && dx > 0) return;
      }

      const maxScrollTop = el.scrollHeight - el.clientHeight;
      if (maxScrollTop <= 0) {
        // No scrolling possible — prevent scroll chaining/bounce.
        e.preventDefault();
        return;
      }

      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop >= maxScrollTop;

      // Pulling down while at the top OR pulling up while at the bottom
      if ((dy > 0 && atTop) || (dy < 0 && atBottom)) {
        e.preventDefault();
      }
    };

    // touchstart can be passive; touchmove must be non-passive for preventDefault to work.
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [scrollRef, options]);
}
