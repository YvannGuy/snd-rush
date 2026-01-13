
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionChevron from './SectionChevron';

interface GallerySectionProps {
  language: 'fr' | 'en';
}

export default function GallerySection({ language }: GallerySectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  const mediaItems = useMemo(() => [
    {
      type: 'video',
      src: '/video1.mp4',
      alt: language === 'fr' ? 'Vidéo 1 - Nos équipements en action' : 'Video 1 - Our equipment in action'
    },
    {
      type: 'video',
      src: '/video2.mp4',
      alt: language === 'fr' ? 'Vidéo 2 - Nos équipements en action' : 'Video 2 - Our equipment in action'
    },
    {
      type: 'video',
      src: '/video3.mp4',
      alt: language === 'fr' ? 'Vidéo 3 - Nos équipements en action' : 'Video 3 - Our equipment in action'
    },
    {
      type: 'video',
      src: '/Dj.MP4',
      alt: language === 'fr' ? 'Vidéo DJ - Nos équipements en action' : 'DJ Video - Our equipment in action'
    },
    {
      type: 'video',
      src: '/cai-2.mp4',
      alt: language === 'fr' ? 'Vidéo CAI - Nos équipements en action' : 'CAI Video - Our equipment in action'
    }
  ], [language]);

  const handleVideoPlay = (index: number) => {
    setPlayingVideos(prev => new Set(prev).add(index));
  };

  const handleVideoPause = (index: number) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const openVideo = (videoSrc: string) => {
    setSelectedVideo(videoSrc);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  // Responsive: 1 vidéo sur mobile, 3 sur desktop
  const [videosPerView, setVideosPerView] = useState(3);
  
  // Effet pour gérer le responsive
  useEffect(() => {
    const updateVideosPerView = () => {
      const newVideosPerView = window.innerWidth < 768 ? 1 : 3;
      setVideosPerView(newVideosPerView);
    };
    
    updateVideosPerView();
    window.addEventListener('resize', updateVideosPerView);
    return () => window.removeEventListener('resize', updateVideosPerView);
  }, []);

  const maxIndex = Math.max(0, mediaItems.length - videosPerView);

  // Effet pour ajuster l'index si nécessaire quand videosPerView change
  useEffect(() => {
    const newMaxIndex = Math.max(0, mediaItems.length - videosPerView);
    if (currentIndex > newMaxIndex) {
      setCurrentIndex(newMaxIndex);
    }
  }, [videosPerView, mediaItems.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      <section id="gallery" className="py-24 lg:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header - Masqué */}
          {/* <div className="text-center mb-20">
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {texts[language].description}
            </p>
          </div> */}

          {/* Video Slider */}
          <div className="relative">
            <div 
              ref={sliderRef}
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-4 md:gap-6 lg:gap-8"
                style={{ transform: `translateX(-${currentIndex * (100 / videosPerView)}%)` }}
              >
                {mediaItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video hover:shadow-2xl transition-all duration-500 cursor-pointer flex-shrink-0"
                    style={{ 
                      width: videosPerView === 1 
                        ? '100%' 
                        : `calc((100% - ${(videosPerView - 1) * 1.5}rem) / ${videosPerView})` 
                    }}
                    onMouseEnter={() => {
                      const video = videoRefs.current[index];
                      if (video) {
                        video.play().catch(() => {});
                      }
                    }}
                    onMouseLeave={() => {
                      const video = videoRefs.current[index];
                      if (video) {
                        video.pause();
                      }
                    }}
                    onClick={() => openVideo(item.src)}
                  >
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={item.src}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      loop
                      onPlay={() => handleVideoPlay(index)}
                      onPause={() => handleVideoPause(index)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {/* Play overlay when not playing */}
                    {!playingVideos.has(index) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {currentIndex > 0 && (
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg hover:shadow-xl z-10"
                aria-label={language === 'fr' ? 'Vidéo précédente' : 'Previous video'}
              >
                <ChevronLeft className="w-6 h-6 text-black" />
              </button>
            )}
            {currentIndex < maxIndex && (
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg hover:shadow-xl z-10"
                aria-label={language === 'fr' ? 'Vidéo suivante' : 'Next video'}
              >
                <ChevronRight className="w-6 h-6 text-black" />
              </button>
            )}

            {/* Dots Indicator */}
            {mediaItems.length > videosPerView && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-[#F2431E] w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={language === 'fr' ? `Aller à la page ${index + 1}` : `Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <SectionChevron nextSectionId="trusted" />
      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={closeVideo}
        >
          <div className="relative max-w-7xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeVideo}
              className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full h-full max-h-[90vh] rounded-lg"
            >
              {language === 'fr' ? 'Votre navigateur ne supporte pas la lecture de vidéos.' : 'Your browser does not support video playback.'}
            </video>
          </div>
        </div>
      )}
    </>
  );
}
