'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

export function FAQSection() {
  const { locale } = useHomeLocale();
  const copy = getContactCopy(locale).faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#f3efe9]" id="studio">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[880px]">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#6f6a63]">
            {copy.title}
          </h2>
          <div className="mt-8 divide-y divide-[#ddd6cd] border-t border-b border-[#ddd6cd]">
          {copy.items.map((faq, idx) => {
            const open = openIndex === idx;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left text-[#171717] transition hover:text-[#d95c18]"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-[#f36b21] transition-transform',
                      open ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </button>
                {open ? (
                  <div className="px-1 pb-4 text-sm leading-relaxed text-[#6f6a63]">{faq.answer}</div>
                ) : null}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
