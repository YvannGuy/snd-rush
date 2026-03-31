'use client';

import { ReactNode, useEffect, useRef } from 'react';

type SectionRevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

export default function SectionReveal({ children, delay = 0, y = 20, className }: SectionRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    const run = async () => {
      if (!containerRef.current) return;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const gsapModule = await import('gsap');
      const scrollTriggerModule = await import('gsap/ScrollTrigger');

      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      if (reducedMotion) {
        gsap.set(containerRef.current, { autoAlpha: 1, y: 0 });
        return;
      }

      ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power2.out',
            delay,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 84%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }, containerRef);
    };

    run();

    return () => {
      ctx?.revert();
    };
  }, [delay, y]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
