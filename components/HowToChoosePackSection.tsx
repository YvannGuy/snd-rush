'use client';

import Link from 'next/link';
import Image from 'next/image';
import SectionChevron from './SectionChevron';
import { ArrowRight } from 'lucide-react';

interface HowToChoosePackSectionProps {
  language: 'fr' | 'en';
}

export default function HowToChoosePackSection({ language }: HowToChoosePackSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'GUIDE',
      title: 'Comment choisir son pack pour son événement ?',
      description: 'Trouvez le pack parfait adapté à votre événement : nombre de personnes, lieu (intérieur/extérieur), ambiance souhaitée. Notre guide vous aide à faire le bon choix.',
      cta: 'En savoir plus',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80'
    },
    en: {
      sectionTitle: 'GUIDE',
      title: 'How to choose your pack for your event?',
      description: 'Find the perfect pack adapted to your event: number of people, location (indoor/outdoor), desired atmosphere. Our guide helps you make the right choice.',
      cta: 'Learn more',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="how-to-choose-pack" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={currentTexts.image}
              alt={currentTexts.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={85}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {currentTexts.title}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              {currentTexts.description}
            </p>
            <Link
              href="/comment-choisir-son-pack"
              className="inline-flex items-center gap-2 bg-[#F2431E] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-fit"
            >
              {currentTexts.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
      <SectionChevron nextSectionId="pour-qui" />
    </section>
  );
}

