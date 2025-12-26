
'use client';

import { useState, useRef } from 'react';

interface GallerySectionProps {
  language: 'fr' | 'en';
}

export default function GallerySection({ language }: GallerySectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

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
    }
  ];

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

  return (
    <>
      <section id="gallery" className="py-24 lg:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight mb-8">
              {language === 'fr' ? (
                <>
                  <span className="text-black">Nos équipements </span>
                  <span className="text-[#F2431E]">en action.</span>
                </>
              ) : (
                <>
                  <span className="text-black">Our equipment </span>
                  <span className="text-[#F2431E]">in action.</span>
                </>
              )}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {texts[language].description}
            </p>
          </div>

          {/* Video Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {mediaItems.map((item, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video hover:shadow-2xl transition-all duration-500 cursor-pointer"
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
      </section>

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
