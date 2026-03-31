'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Quels sont les délais habituels pour un devis ?',
    answer:
      'Nous revenons sous 24h avec une première estimation ou une demande de précisions pour cadrer le budget.',
  },
  {
    question: 'Quelle est votre zone d’intervention ?',
    answer: 'Basés à Paris, nous intervenons partout en France et en Europe selon la logistique du projet.',
  },
  {
    question: 'Gérez-vous également la régie complète ?',
    answer:
      'Oui, régie audiovisuelle, coordination prestataires, show-call et supervision live pour garantir la fluidité.',
  },
  {
    question: 'Pouvez-vous intervenir sur de grands événements ?',
    answer:
      'Oui, nous dimensionnons son, lumière, vidéo et LED pour des jauges 10k+ avec redondance et tolérance de panne.',
  },
  {
    question: 'Peut-on vous contacter sans brief technique précis ?',
    answer:
      'Absolument. Nous pouvons co-construire le cadrage, prioriser les besoins et recommander les options techniques.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#f3efe9]" id="studio">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[880px]">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#6f6a63]">
            Questions fréquentes
          </h2>
          <div className="mt-8 divide-y divide-[#ddd6cd] border-t border-b border-[#ddd6cd]">
          {faqs.map((faq, idx) => {
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
