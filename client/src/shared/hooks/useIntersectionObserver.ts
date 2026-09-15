import { useState, useRef, useCallback } from 'react';

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const targetRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observerRef.current?.disconnect();
      }
    }, {
      threshold: options?.threshold,
      rootMargin: options?.rootMargin,
      root: options?.root,
    });

    observerRef.current.observe(node);
  }, []);

  return { isIntersecting, targetRef };
}