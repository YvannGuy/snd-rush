'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400">Aucune image</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Image principale */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
        <Image
          src={images[selectedImage] || images[0]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? 'border-[#F2431E] ring-2 ring-[#F2431E] ring-offset-2'
                  : 'border-gray-200 hover:border-[#F2431E]/50'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Miniature ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

