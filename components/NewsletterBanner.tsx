'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import NewsletterModal from './NewsletterModal';

interface NewsletterBannerProps {
  language: 'fr' | 'en';
}

export default function NewsletterBanner({ language }: NewsletterBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const texts = {
    fr: {
      title: 'Inscrivez-vous pour recevoir nos bons plans',
      button: "S'INSCRIRE À LA NEWSLETTER",
      description: 'Chaque semaine des promos, des évènements, des actus...'
    },
    en: {
      title: 'Subscribe to receive our good deals',
      button: 'SUBSCRIBE TO NEWSLETTER',
      description: 'Every week promotions, events, news...'
    }
  };

  const currentTexts = texts[language];

  return (
    <>
      <section className="bg-[#F2431E] py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Title */}
            <div className="text-center md:text-left">
              <p className="text-white text-lg md:text-xl font-medium">
                {currentTexts.title}
              </p>
            </div>

            {/* Middle: Button */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-white hover:bg-gray-100 text-[#F2431E] font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                {currentTexts.button}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Description */}
            <div className="text-center md:text-right">
              <p className="text-white text-sm md:text-base">
                {currentTexts.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <NewsletterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={language}
      />
    </>
  );
}
