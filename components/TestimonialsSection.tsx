
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
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            Témoignages Clients
          </h2>
          <p className="text-xl text-gray-600">
            Ce que nos clients disent de nous
          </p>
        </div>

        {/* Horizontal Scrollable Testimonials */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max px-4">
            {currentTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow min-w-[350px] max-w-[350px]"
              >
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
                  {testimonial.author.charAt(0)}
                </div>

                {/* Name */}
                <div className="font-semibold text-black text-lg mb-2">
                  {testimonial.author}
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-700 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
