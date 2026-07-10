import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks whether the element attached to `ref` has entered the viewport.
 * Uses IntersectionObserver — once the element becomes visible, the
 * observer disconnects and `isVisible` stays `true` (the reveal never
 * reverses on scroll up).
 */
export function useScrollReveal(
  ref: RefObject<Element | null>,
  threshold = 0.15,
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Already revealed — nothing left to observe.
    if (isVisible) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, isVisible, threshold]);

  return isVisible;
}
