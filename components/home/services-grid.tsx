'use client';

import Image from 'next/image';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getServicesWithImages } from '@/data/home-i18n';

export default function ServicesGrid() {
  const { copy } = useHomeLocale();
  const services = getServicesWithImages(copy);

  return (
    <section id="expertises" className="bg-[#0b0b0b] py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="group overflow-hidden rounded-sm border border-white/10 bg-[#141414] transition-colors hover:border-white/20"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/20" />
              </div>

              <div className="space-y-3 p-5">
                <div className="h-[2px] w-8 bg-[#f36b21]" />
                <p className="font-helvetica text-[10px] font-bold tracking-display text-white/55">
                  {copy.polePrefix} {service.label}
                </p>
                <h3 className="font-helvetica text-xl font-bold leading-tight tracking-display text-white">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
