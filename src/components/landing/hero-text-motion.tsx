"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";

export function HeroTextMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-hero-text]") ?? []);
    if (!targets.length) return;
    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [18, 0],
      delay: stagger(105, { start: 90 }),
      duration: 720,
      ease: "out(3)",
    });
    return () => { animation.revert(); };
  }, []);

  return <div ref={root}>{children}</div>;
}
