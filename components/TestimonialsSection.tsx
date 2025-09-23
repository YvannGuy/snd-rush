
'use client';

import { useState, useEffect } from 'react';

interface TestimonialsSectionProps {
  language: 'fr' | 'en';
}

export default function TestimonialsSection({ language }: TestimonialsSectionProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const texts = {
    fr: {
      title: 'Ils ont vécu l\'instant.',
      titleHighlight: 'Voici ce qu\'ils en disent.'
    },
    en: {
      title: 'They lived the moment.',
      titleHighlight: 'Here\'s what they say.'
    }
  };

  const testimonials = {
    fr: [
      {
        id: 1,
        quote: "Un service impeccable , avec du matériel audio de très bonne qualité , j\'ai eu recours au service pour un événement la livraison a été rapide de plus les prix sont très abordables. Je recommande ",
        author: "Gildas M.",
        event: "Anniversaire 30 ans",
        rating: 5
      },
      {
        id: 2,
        quote: "Service incroyable, je les recommande vivement pour tous types d\'événements !",
        author: "Alison T.",
        event: "Conférence",
        rating: 5
      },
      {
        id: 3,
        quote: "Je conseille snd rush, de la préparation a la livraison, et meme la qualité du matériel pour l'ouverture du magasin charlotte tilbury ils ont assuré",
        author: "Hamadi Billy",
        event: "Ouverture magasin Charlotte Tilbury",
        rating: 5
      }
    ],
    en: [
      {
        id: 1,
        quote: "Impeccable service, with very good quality audio equipment, I used the service for an event the delivery was fast and the prices are very affordable. I recommend ",
        author: "Gildas M.",
        event: "30th Birthday",
        rating: 5
      },
      {
        id: 2,
        quote: "Amazing service, I highly recommend them for any events!",
        author: "Alison T.",
        event: "Conference",
        rating: 5
      },
      {
        id: 3,
        quote: "I recommend snd rush, from preparation to delivery, and even the quality of the equipment for the opening of the Charlotte Tilbury store they delivered",
        author: "Hamadi Billy",
        event: "Charlotte Tilbury Store Opening",
        rating: 5
      }
    ]
  };

  const currentTestimonials = testimonials[language];

  // Auto-rotate testimonials on mobile (disabled for manual navigation)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentTestimonial((prev) => (prev + 1) % currentTestimonials.length);
  //   }, 6000);

  //   return () => clearInterval(interval);
  // }, [currentTestimonials.length]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i}
        className={`ri-star-fill text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F2431E]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F2431E]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
            {texts[language].title}
          </h2>
          <p className="text-xl text-[#F2431E] font-medium">
            {texts[language].titleHighlight}
          </p>
        </div>

        {/* Modern Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="group relative"
            >
              {/* Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 hover:-translate-y-2 border border-white/20">
                {/* Quote icon */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center shadow-lg">
                  <i className="ri-double-quotes-l text-white text-xl"></i>
                </div>

                {/* Quote */}
                <blockquote className="text-gray-800 text-lg leading-relaxed mb-6 pt-4">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.author.charAt(0)}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.event}
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>

                {/* Decorative line */}
                <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-[#F2431E] to-transparent rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 bg-white/60 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-white/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {renderStars(5)}
              </div>
              <span className="text-gray-700 font-medium">4.9/5</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="text-gray-700 font-medium">
              {language === 'fr' ? 'Plus de 200 événements' : 'Over 200 events'}
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="text-gray-700 font-medium">
              {language === 'fr' ? '100% satisfaits' : '100% satisfied'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
