'use client';

import SectionChevron from './SectionChevron';

interface RecentEventsSectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

const MEDIA_ITEMS = [
  { src: '/IMG_1689.MOV', type: 'video' as const },
  { src: '/IMG_1765.MOV', type: 'video' as const },
  { src: '/IMG_1768.MOV', type: 'video' as const },
  { src: '/IMG_1775.MOV', type: 'video' as const },
  { src: '/IMG_1789.MOV', type: 'video' as const },
];

export default function RecentEventsSection({ language }: RecentEventsSectionProps) {

  const texts = {
    fr: {
      sectionTitle: 'NOS RÉCENTS ÉVÉNEMENTS',
      title: 'Showroom pour la marque espagnole Nude Project',
    },
    en: {
      sectionTitle: 'OUR RECENT EVENTS',
      title: 'Showroom for the Spanish brand Nude Project',
    },
    it: {
      sectionTitle: 'I NOSTRI ULTIMI EVENTI',
      title: 'Showroom per il marchio spagnolo Nude Project',
    },
    es: {
      sectionTitle: 'NUESTROS EVENTOS RECIENTES',
      title: 'Showroom para la marca española Nude Project',
    },
    zh: {
      sectionTitle: '近期活动',
      title: '西班牙品牌 Nude Project 展厅',
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="recent-events" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black mb-12 text-center">
          {currentTexts.title}
        </h2>

        {/* Media Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {MEDIA_ITEMS.map((item, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden bg-black/5 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {item.type === 'video' ? (
                <video
                  src={item.src}
                  controls
                  playsInline
                  className="w-full h-full object-cover aspect-square md:aspect-video"
                />
              ) : (
                <img
                  src={item.src}
                  alt={`Événement SoundRush Paris ${index + 1}`}
                  className="w-full h-full object-cover aspect-square md:aspect-video min-h-[180px] bg-gray-200"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <SectionChevron nextSectionId="contact" />
    </section>
  );
}
