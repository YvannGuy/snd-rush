
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
    <section className="py-24 lg:py-32 bg-[#FAFAFA] transition-all duration-1000 ease-in-out mx-4 mb-8 rounded-3xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-20 transform transition-all duration-1000 ease-in-out">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight transition-all duration-1000 ease-in-out">
            {texts[language].title}{' '}
            <span className="text-[#F2431E]">{texts[language].titleHighlight}</span>
          </h2>
        </div>

        {/* Desktop Carousel Layout */}
        <div className="hidden lg:block">
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 33.333}%)` }}
            >
              {currentTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="w-1/3 flex-shrink-0 px-6"
                >
                  <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out transform hover:scale-[1.02] hover:-translate-y-1">
                    {/* Quote */}
                    <div className="mb-8">
                      <div className="text-4xl text-[#F2431E] mb-6 opacity-30">
                        <i className="ri-double-quotes-l"></i>
                      </div>
                      <blockquote className="text-xl md:text-2xl text-black leading-relaxed italic font-light">
                        {testimonial.quote}
                      </blockquote>
                    </div>

                    {/* Author info and rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {/* User silhouette */}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#AAAAAA] to-gray-400 rounded-full flex items-center justify-center">
                          <i className="ri-user-3-fill text-white text-xl"></i>
                        </div>
                        
                        <div>
                          <div className="font-medium text-black text-lg">
                            {testimonial.author}
                          </div>
                          <div className="text-base text-[#AAAAAA] italic">
                            {testimonial.event}
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Navigation Arrows */}
          <div className="flex justify-center items-center gap-6 mt-12">
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + currentTestimonials.length) % currentTestimonials.length)}
              className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
            >
              <i className="ri-arrow-left-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
            </button>

            {/* Desktop indicators */}
            <div className="flex gap-2">
              {currentTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-[#F2431E]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % currentTestimonials.length)}
              className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
            >
              <i className="ri-arrow-right-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
            </button>
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {currentTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-lg">
                    {/* Quote */}
                    <div className="mb-6">
                      <div className="text-3xl text-[#F2431E] mb-4 opacity-30">
                        <i className="ri-double-quotes-l"></i>
                      </div>
                      <blockquote className="text-xl text-black leading-relaxed italic font-light">
                        {testimonial.quote}
                      </blockquote>
                    </div>

                    {/* Author info and rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* User silhouette */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#AAAAAA] to-gray-400 rounded-full flex items-center justify-center">
                          <i className="ri-user-3-fill text-white text-base"></i>
                        </div>
                        
                        <div>
                          <div className="font-medium text-black text-base">
                            {testimonial.author}
                          </div>
                          <div className="text-sm text-[#AAAAAA] italic">
                            {testimonial.event}
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {currentTestimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-[#F2431E] w-8' 
                    : 'bg-[#AAAAAA]'
                }`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
