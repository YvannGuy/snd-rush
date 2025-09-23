
'use client';

import { useState, useEffect } from 'react';

interface GallerySectionProps {
  language: 'fr' | 'en';
}

export default function GallerySection({ language }: GallerySectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const texts = {
    fr: {
      title: "Nos équipements en action.",
      subtitle: "",
      description: "Découvrez notre matériel professionnel et nos interventions lors d\'évènements variés."
    },
    en: {
      title: "Our equipment in action.",
      subtitle: "",
      description: "Discover our professional equipment and our interventions during various events."
    }
  };

  const mediaItems = [
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Professional%20DJ%20mixing%20live%20music%20at%20elegant%20wedding%20reception%20with%20high-end%20audio%20equipment%2C%20mixing%20console%20with%20glowing%20buttons%2C%20speakers%20and%20microphones%20setup%2C%20warm%20ambient%20lighting%2C%20guests%20dancing%20in%20background%2C%20premium%20sound%20system%20installation&width=800&height=600&seq=gallery-1&orientation=landscape',
      alt: 'DJ professionnel lors d\'un mariage'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Corporate%20conference%20setup%20with%20professional%20microphones%2C%20large%20speakers%2C%20and%20audio%20mixing%20equipment%2C%20business%20presentation%20environment%2C%20clean%20modern%20venue%2C%20professional%20lighting%2C%20attendees%20listening%20to%20speaker&width=800&height=600&seq=gallery-2&orientation=landscape',
      alt: 'Conférence d\'entreprise'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Live%20concert%20stage%20with%20powerful%20professional%20speakers%2C%20mixing%20console%2C%20microphones%2C%20stage%20lighting%2C%20musicians%20performing%2C%20audience%20enjoying%20music%2C%20high-quality%20sound%20system%2C%20concert%20venue%20atmosphere&width=800&height=600&seq=gallery-3&orientation=landscape',
      alt: 'Concert en direct'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Birthday%20party%20celebration%20with%20professional%20sound%20system%2C%20DJ%20equipment%2C%20colorful%20party%20lights%2C%20people%20dancing%20and%20celebrating%2C%20speakers%20and%20audio%20setup%2C%20festive%20atmosphere%2C%20modern%20venue&width=800&height=600&seq=gallery-4&orientation=landscape',
      alt: 'Fête d\'anniversaire'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Professional%20audio%20technician%20installing%20high-end%20sound%20equipment%2C%20mixing%20console%20setup%2C%20speakers%20placement%2C%20technical%20expertise%2C%20modern%20audio%20gear%2C%20professional%20installation%20service%2C%20clean%20workspace&width=800&height=600&seq=gallery-5&orientation=landscape',
      alt: 'Installation technique'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Outdoor%20event%20with%20professional%20sound%20system%2C%20large%20speakers%2C%20mixing%20equipment%2C%20people%20enjoying%20music%20outdoors%2C%20festival%20atmosphere%2C%20professional%20audio%20setup%2C%20sunny%20day%20event&width=800&height=600&seq=gallery-6&orientation=landscape',
      alt: 'Événement extérieur'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=High-end%20professional%20audio%20equipment%20collection%2C%20mixing%20consoles%2C%20speakers%2C%20microphones%2C%20cables%2C%20technical%20gear%20organized%20professionally%2C%20modern%20audio%20rental%20inventory%2C%20premium%20sound%20equipment&width=800&height=600&seq=gallery-7&orientation=landscape',
      alt: 'Matériel professionnel'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Wedding%20ceremony%20with%20professional%20sound%20system%2C%20elegant%20venue%2C%20bride%20and%20groom%2C%20guests%20seated%2C%20microphones%20for%20vows%2C%20speakers%20discreetly%20placed%2C%20romantic%20atmosphere%2C%20premium%20audio%20service&width=800&height=600&seq=gallery-8&orientation=landscape',
      alt: 'Cérémonie de mariage'
    }
  ];

  const totalSlides = Math.ceil(mediaItems.length / 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  const getCurrentSlideItems = () => {
    const startIndex = currentSlide * 4;
    return mediaItems.slice(startIndex, startIndex + 4);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const openImage = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <section className="py-24 lg:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight mb-8">
              <span className="text-black">Nos équipements </span>
              <span className="text-[#F2431E]">en action.</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {texts[language].description}
            </p>
          </div>

          {/* Gallery Slider */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                      {mediaItems.slice(slideIndex * 4, slideIndex * 4 + 4).map((item, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] hover:shadow-xl transition-all duration-500">
                          <img
                            src={item.src}
                            alt={item.alt}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => openImage(item.src)}
                              className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                            >
                              <i className="ri-eye-line text-2xl text-black"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-10"
            >
              <i className="ri-arrow-left-line text-xl text-black"></i>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-10"
            >
              <i className="ri-arrow-right-line text-xl text-black"></i>
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentSlide 
                    ? 'bg-[#F2431E] w-8' 
                    : 'bg-gray-300 w-3 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeImage}
              className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            >
              <i className="ri-close-line text-2xl text-black"></i>
            </button>
            <img
              src={selectedImage}
              alt="Image en plein écran"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
