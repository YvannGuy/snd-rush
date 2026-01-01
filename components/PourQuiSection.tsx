'use client';

import SectionChevron from './SectionChevron';

interface PourQuiSectionProps {
  language: 'fr' | 'en';
}

export default function PourQuiSection({ language }: PourQuiSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'POUR QUI ?',
      title: 'On s\'occupe de tout, pour tous vos événements',
      categories: [
        { 
          name: 'Mariages', 
          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Anniversaires', 
          image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Concerts & live', 
          image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Soirées privées', 
          image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Corporate & séminaires', 
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Associations & églises', 
          image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Écoles & salles municipales', 
          image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Festivals & événements', 
          image: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&h=300&fit=crop&q=80'
        }
      ],
      cta: 'Voir les packs adaptés'
    },
    en: {
      sectionTitle: 'FOR WHO?',
      title: 'We take care of everything, for all your events',
      categories: [
        { 
          name: 'Weddings', 
          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Birthdays', 
          image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Concerts & live', 
          image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Private parties', 
          image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Corporate & seminars', 
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Associations & churches', 
          image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Schools & town halls', 
          image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop&q=80'
        },
        { 
          name: 'Festivals & events', 
          image: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&h=300&fit=crop&q=80'
        }
      ],
      cta: 'View adapted packs'
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="pour-qui" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-12 text-center">
          {language === 'fr' ? (
            <>
              <span className="text-black">On s'occupe de tout, pour tous vos </span>
              <span className="text-[#F2431E]">événements</span>
            </>
          ) : (
            <>
              <span className="text-black">We take care of everything, for all your </span>
              <span className="text-[#F2431E]">events</span>
            </>
          )}
        </h2>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {currentTexts.categories.map((category, index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-[#F2431E] transition-all hover:shadow-lg cursor-pointer transform hover:scale-105 group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              </div>
              
              {/* Category Name */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-bold text-white text-sm lg:text-base drop-shadow-lg">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SectionChevron nextSectionId="about" />
    </section>
  );
}

