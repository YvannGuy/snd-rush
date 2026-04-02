'use client';

import { useMemo, useRef } from 'react';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

/** Découpe la chaîne i18n (séparateurs • ou ·) en libellés. */
function parseExpertiseItems(strip: string): string[] {
  return strip.split(/\s*[•·]\s*/u).map((s) => s.trim()).filter(Boolean);
}

export default function ExpertiseStrip() {
  const { copy } = useHomeLocale();
  const items = useMemo(() => parseExpertiseItems(copy.expertiseStrip), [copy.expertiseStrip]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  return (
    <section className="border-y border-black/10 bg-white py-4">
      <div className="mx-auto w-full max-w-[1280px] px-3 text-center">
        <p className="hidden font-helvetica text-sm font-bold tracking-display text-[#050505] sm:block sm:text-xl lg:text-[34px] lg:leading-none">
          {copy.expertiseStrip}
        </p>

        <div
          ref={scrollRef}
          className="sm:hidden -mx-3 cursor-grab touch-pan-x select-none overflow-x-auto overflow-y-hidden py-1 active:cursor-grabbing [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/25"
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse' || !scrollRef.current) return;
            drag.current = {
              active: true,
              startX: e.clientX,
              scrollLeft: scrollRef.current.scrollLeft,
            };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current.active || e.pointerType !== 'mouse' || !scrollRef.current) return;
            const dx = e.clientX - drag.current.startX;
            scrollRef.current.scrollLeft = drag.current.scrollLeft - dx;
          }}
          onPointerUp={(e) => {
            if (e.pointerType !== 'mouse') return;
            drag.current.active = false;
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
              /* capture déjà relâché */
            }
          }}
          onPointerCancel={() => {
            drag.current.active = false;
          }}
        >
          <div className="flex w-max items-baseline gap-x-0 px-5 font-helvetica text-2xl font-bold leading-tight tracking-display text-[#050505]">
            {items.map((item, i) => (
              <span key={`${item}-${i}`} className="flex shrink-0 items-baseline">
                {i > 0 ? <span className="mx-3 text-black/30" aria-hidden>•</span> : null}
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
