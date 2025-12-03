'use client';

import Link from 'next/link';

interface CatalogueSectionProps {
  language: 'fr' | 'en';
}

export default function CatalogueSection({ language }: CatalogueSectionProps) {
  const texts = {
    fr: {
      title: 'Catalogue',
      subtitle: 'Matériel professionnel adapté à vos besoins',
      addToCart: 'Ajouter au panier',
      viewCatalogue: 'Voir catalogue',
      products: [
        {
          id: 1,
          name: 'Enceinte JBL PRX',
          description: 'Professionnel',
          price: '45€/jour',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 2,
          name: 'Table de mixage Pioneer',
          description: 'Professionnel',
          price: '65€/jour',
          image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 3,
          name: 'Micro sans fil Shure',
          description: 'Professionnel',
          price: '25€/jour',
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 4,
          name: 'Caisson de basse',
          description: 'Professionnel',
          price: '35€/jour',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 5,
          name: 'Éclairage LED',
          description: 'Professionnel',
          price: '30€/jour',
          image: 'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?w=800&h=600&fit=crop&q=80'
        }
      ]
    },
    en: {
      title: 'Catalogue',
      subtitle: 'Professional equipment adapted to your needs',
      addToCart: 'Add to cart',
      viewCatalogue: 'View catalogue',
      products: [
        {
          id: 1,
          name: 'JBL PRX Speaker',
          description: 'Professional',
          price: '45€/day',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 2,
          name: 'Pioneer Mixing Console',
          description: 'Professional',
          price: '65€/day',
          image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 3,
          name: 'Shure Wireless Microphone',
          description: 'Professional',
          price: '25€/day',
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 4,
          name: 'Subwoofer',
          description: 'Professional',
          price: '35€/day',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80'
        },
        {
          id: 5,
          name: 'LED Lighting',
          description: 'Professional',
          price: '30€/day',
          image: 'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?w=800&h=600&fit=crop&q=80'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  return (
    <section id="catalogue" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            {currentTexts.title}
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            {currentTexts.subtitle}
          </p>
          <Link
            href="/catalogue"
            className="inline-block bg-[#F2431E] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors"
          >
            {currentTexts.viewCatalogue}
          </Link>
        </div>

        {/* Products - Horizontal Scrollable */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max px-4">
            {currentTexts.products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow min-w-[300px] max-w-[300px]"
              >
                {/* Image placeholder */}
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Product Info */}
                <h3 className="text-xl font-bold text-black mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

