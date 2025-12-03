'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PackDetailContentProps {
  packId: string;
  language: 'fr' | 'en';
}

interface Pack {
  id: number;
  name: string;
  tagline: string;
  description: string;
  priceParis: string;
  priceHorsParis: string;
  featured: boolean;
  image: string;
  features: string[];
  highlight: string;
  ideal: string;
  note: string;
}

export default function PackDetailContent({ packId, language }: PackDetailContentProps) {
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 2,
        name: "Conférence",
        tagline: "Séminaires & formations",
        description: "Sonorisation claire et professionnelle pour vos événements d'entreprise et formations.",
        priceParis: "À partir de 550 € TTC",
        priceHorsParis: "630 € TTC",
        featured: true,
        image: "/conference.jpg",
        features: [
          "Sonorisation claire et professionnelle",
          "Micro pour présentations",
          "Livraison & installation",
          "Technicien pendant l'événement",
          "Démontage après la conférence"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 150 personnes",
        note: "Idéal conférences, séminaires, formations, présentations d'entreprise."
      },
      {
        id: 3,
        name: "Mariage",
        tagline: "Grand jour & réceptions",
        description: "Sonorisation romantique et élégante pour votre plus beau jour.",
        priceParis: "À partir de 700 € TTC",
        priceHorsParis: "780 € TTC",
        featured: false,
        image: "/mariage.jpg",
        features: [
          "Sonorisation romantique et élégante",
          "Micros pour discours et toasts",
          "Livraison & installation",
          "Technicien discret pendant la cérémonie",
          "Démontage après la réception"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 250 personnes",
        note: "Parfait pour mariages, anniversaires de mariage, réceptions élégantes."
      },
      {
        id: 5,
        name: "Concert",
        tagline: "Spectacles & festivals",
        description: "Sonorisation puissante et professionnelle pour vos événements musicaux.",
        priceParis: "À partir de 1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Sonorisation puissante et professionnelle",
          "Micros sans fil pour les artistes",
          "Livraison & installation complète",
          "Technicien son pendant le spectacle",
          "Démontage après le concert"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 500 personnes",
        note: "Idéal concerts, festivals, spectacles, événements musicaux."
      },
      {
        id: 6,
        name: "Soirée",
        tagline: "Fêtes & événements privés",
        description: "Sonorisation festive et énergique pour vos soirées et événements privés.",
        priceParis: "À partir de 450 € TTC",
        priceHorsParis: "530 € TTC",
        featured: false,
        image: "/dance.jpg",
        features: [
          "Sonorisation festive et énergique",
          "Musique d'ambiance et DJ",
          "Livraison & installation",
          "Technicien pendant la soirée",
          "Démontage après l'événement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 200 personnes",
        note: "Idéal pour soirées privées, anniversaires, fêtes d'entreprise, événements festifs."
      }
    ],
    en: [
      {
        id: 2,
        name: "Conference",
        tagline: "Seminars & training",
        description: "Clear and professional sound system for your corporate events and training.",
        priceParis: "From 550 € TTC",
        priceHorsParis: "630 € TTC",
        featured: true,
        image: "/conference.jpg",
        features: [
          "Clear and professional sound system",
          "Microphone for presentations",
          "Delivery & installation",
          "Technician during the event",
          "Dismantling after the conference"
        ],
        highlight: "Turnkey",
        ideal: "Up to 150 people",
        note: "Ideal for conferences, seminars, training, corporate presentations."
      },
      {
        id: 3,
        name: "Wedding",
        tagline: "Special day & receptions",
        description: "Romantic and elegant sound system for your special day.",
        priceParis: "From 700 € TTC",
        priceHorsParis: "780 € TTC",
        featured: false,
        image: "/mariage.jpg",
        features: [
          "Romantic and elegant sound system",
          "Microphones for speeches and toasts",
          "Delivery & installation",
          "Discreet technician during the ceremony",
          "Dismantling after the reception"
        ],
        highlight: "Turnkey",
        ideal: "Up to 250 people",
        note: "Perfect for weddings, wedding anniversaries, elegant receptions."
      },
      {
        id: 5,
        name: "Concert",
        tagline: "Shows & festivals",
        description: "Powerful and professional sound system for your musical events.",
        priceParis: "From 1,100 € TTC",
        priceHorsParis: "1,180 € TTC",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Powerful and professional sound system",
          "Wireless microphones for artists",
          "Complete delivery & installation",
          "Sound technician during the show",
          "Dismantling after the concert"
        ],
        highlight: "Turnkey",
        ideal: "Up to 500 people",
        note: "Ideal for concerts, festivals, shows, musical events."
      },
      {
        id: 6,
        name: "Party",
        tagline: "Parties & private events",
        description: "Festive and energetic sound system for your parties and private events.",
        priceParis: "From 450 € TTC",
        priceHorsParis: "530 € TTC",
        featured: false,
        image: "/dance.jpg",
        features: [
          "Festive and energetic sound system",
          "Ambient music and DJ",
          "Delivery & installation",
          "Technician during the party",
          "Dismantling after the event"
        ],
        highlight: "Turnkey",
        ideal: "Up to 200 people",
        note: "Ideal for private parties, birthdays, corporate parties, festive events."
      }
    ]
  };

  const packIdNum = parseInt(packId);
  const currentPacks = packs[language];
  const pack = currentPacks.find(p => p.id === packIdNum);

  const texts = {
    fr: {
      included: 'Inclus dans ce pack',
      viewFullSheet: 'Voir la fiche technique complète >',
      capacities: 'Capacités & usages recommandés',
      capacity: 'Capacité',
      recommendedScenarios: 'Scénarios recommandés',
      environment: 'Environnement',
      availableOptions: 'Options disponibles',
      delivery: 'Livraison & installation',
      technician: 'Technicien son',
      emergency: 'Urgence 2h',
      add: 'Ajouter',
      photos: 'Photos & détails',
      testimonials: 'Ce que nos clients en disent',
      addToQuote: 'Obtenir un devis',
      talkToExpert: 'Parler à un expert',
      bookNow: 'Réserver maintenant',
      call: 'Appeler',
      from: 'À partir de',
      perDay: '/ jour',
      rating: '4.9/5',
      events: '200+ événements',
      satisfied: '100% satisfaits',
      idealFor: 'Idéal pour',
      interiorExterior: 'Intérieur & extérieur',
      faq: 'Questions fréquentes',
      faqQuestions: [
        {
          question: "Vos prestations sont-elles assurées ?",
          answer: "Oui, toutes nos prestations sont couvertes par une assurance responsabilité civile professionnelle."
        },
        {
          question: "Puis-je modifier ma réservation ?",
          answer: "Oui, vous pouvez modifier votre réservation jusqu'à 48h avant l'événement sous réserve de disponibilité."
        },
        {
          question: "Que se passe-t-il en cas de matériel endommagé ?",
          answer: "Une caution est demandée lors de la réservation. En cas de dommage, celle-ci sera utilisée pour couvrir les réparations."
        },
        {
          question: "Quel est le temps de réponse moyen ?",
          answer: "Nous répondons généralement sous 2 heures en journée et sous 4 heures en soirée et week-end."
        }
      ]
    },
    en: {
      included: 'Included in this pack',
      viewFullSheet: 'View full technical sheet >',
      capacities: 'Capacities & recommended usages',
      capacity: 'Capacity',
      recommendedScenarios: 'Recommended scenarios',
      environment: 'Environment',
      availableOptions: 'Available options',
      delivery: 'Delivery & installation',
      technician: 'Sound technician',
      emergency: 'Emergency 2h',
      add: 'Add',
      photos: 'Photos & details',
      testimonials: 'What our clients say',
      addToQuote: 'Get a quote',
      talkToExpert: 'Talk to an expert',
      bookNow: 'Book now',
      call: 'Call',
      from: 'From',
      perDay: '/ day',
      rating: '4.9/5',
      events: '200+ events',
      satisfied: '100% satisfied',
      idealFor: 'Ideal for',
      interiorExterior: 'Interior & exterior',
      faq: 'Frequently asked questions',
      faqQuestions: [
        {
          question: "Are your services insured?",
          answer: "Yes, all our services are covered by professional liability insurance."
        },
        {
          question: "Can I modify my reservation?",
          answer: "Yes, you can modify your reservation up to 48 hours before the event subject to availability."
        },
        {
          question: "What happens if equipment is damaged?",
          answer: "A deposit is required when booking. In case of damage, it will be used to cover repairs."
        },
        {
          question: "What is the average response time?",
          answer: "We generally respond within 2 hours during the day and within 4 hours in the evening and weekends."
        }
      ]
    }
  };

  const currentTexts = texts[language];

  // Extract price number for sticky bar
  const extractPrice = (priceStr: string): number => {
    const match = priceStr.match(/(\d+(?:\s?\d+)?)/);
    return match ? parseInt(match[1].replace(/\s/g, '')) : 0;
  };

  const basePrice = pack ? extractPrice(pack.priceParis) : 0;

  // Sticky bar visibility
  useEffect(() => {
    const handleScroll = () => {
      const faqSection = document.getElementById('faq-section');
      if (faqSection) {
        const faqTop = faqSection.getBoundingClientRect().top;
        setIsStickyVisible(faqTop > window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!pack) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Pack non trouvé</h1>
          <p className="text-gray-600">Le pack demandé n'existe pas.</p>
        </div>
      </div>
    );
  }

  // Enhanced features with icons mapping
  const featureIcons: Record<string, string> = {
    'enceinte': '🔊',
    'speaker': '🔊',
    'table': '🎛️',
    'mixage': '🎛️',
    'micro': '🎤',
    'microphone': '🎤',
    'console': '🎧',
    'dj': '🎧',
    'câblage': '🔌',
    'cable': '🔌',
    'installation': '🔧',
    'technicien': '👤',
    'technician': '👤'
  };

  const getFeatureIcon = (feature: string): string => {
    const lowerFeature = feature.toLowerCase();
    for (const [key, icon] of Object.entries(featureIcons)) {
      if (lowerFeature.includes(key)) {
        return icon;
      }
    }
    return '✓';
  };

  // Parse capacity from ideal field
  const parseCapacity = (ideal: string): string => {
    const match = ideal.match(/(\d+)\s*(?:à|-)?\s*(\d+)?/);
    if (match) {
      const min = match[1];
      const max = match[2] || min;
      return `${min}-${max} personnes`;
    }
    return ideal;
  };

  const capacity = parseCapacity(pack.ideal);

  return (
    <div className="pt-16">
      {/* Main Product Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Product Info */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
                Pack {pack.name} — {capacity}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {currentTexts.idealFor} {pack.note.split(' ').slice(-3).join(' ')}
              </p>
              
              <div className="text-4xl font-bold text-black mb-8">
                {currentTexts.from} {basePrice}€ {currentTexts.perDay}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <a
                  href="/devis"
                  className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E63A1A] transition-colors text-center"
                >
                  {currentTexts.addToQuote}
                </a>
                <a
                  href="tel:+33651084994"
                  className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-black hover:text-white transition-colors text-center"
                >
                  {currentTexts.talkToExpert}
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★★★★★</span>
                  <span>{currentTexts.rating}</span>
                </div>
                <span>•</span>
                <span>{currentTexts.events}</span>
                <span>•</span>
                <span>{currentTexts.satisfied}</span>
              </div>
            </div>

            {/* Right Column - Main Image */}
            <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden">
              <img
                src={pack.image}
                alt={pack.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Included Features Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.included}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pack.features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md flex items-start gap-4"
              >
                <div className="text-3xl flex-shrink-0">
                  {getFeatureIcon(feature)}
                </div>
                <p className="text-gray-700 font-medium">{feature}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a href="#" className="text-gray-600 hover:text-[#F2431E] transition-colors">
              {currentTexts.viewFullSheet}
            </a>
          </div>
        </div>
      </div>

      {/* Capacities & Usage Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.capacities}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
              <div className="text-3xl">👥</div>
              <div>
                <p className="font-semibold text-black mb-1">{currentTexts.capacity}</p>
                <p className="text-gray-600">{capacity}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
              <div className="text-3xl">📅</div>
              <div>
                <p className="font-semibold text-black mb-1">{currentTexts.recommendedScenarios}</p>
                <p className="text-gray-600">{pack.note}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
              <div className="text-3xl">📍</div>
              <div>
                <p className="font-semibold text-black mb-1">{currentTexts.environment}</p>
                <p className="text-gray-600">{currentTexts.interiorExterior}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Options Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.availableOptions}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🚚</div>
                <div>
                  <p className="font-semibold text-black">{currentTexts.delivery}</p>
                  <p className="text-gray-600">{currentTexts.from} 80€</p>
                </div>
              </div>
              <button className="bg-[#F2431E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors">
                {currentTexts.add}
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">👤</div>
                <div>
                  <p className="font-semibold text-black">{currentTexts.technician}</p>
                  <p className="text-gray-600">{currentTexts.from} 60€/h</p>
                </div>
              </div>
              <button className="bg-[#F2431E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors">
                {currentTexts.add}
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚡</div>
                <div>
                  <p className="font-semibold text-black">{currentTexts.emergency}</p>
                  <p className="text-gray-600">Supplément +30%</p>
                </div>
              </div>
              <button className="bg-[#F2431E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors">
                {currentTexts.add}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photos & Details Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.photos}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            <div className="flex-shrink-0 w-80 h-64 rounded-xl overflow-hidden">
              <img src="/enceintebt.jpg" alt="Enceinte" className="w-full h-full object-cover" />
            </div>
            <div className="flex-shrink-0 w-80 h-64 rounded-xl overflow-hidden">
              <img src={pack.image} alt={pack.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-shrink-0 w-80 h-64 rounded-xl overflow-hidden">
              <img src="/platinedj.jpg" alt="Console DJ" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.testimonials}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-black">Marie D.</p>
                  <div className="flex text-yellow-400">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-700">
                "Service impeccable, matériel de qualité et équipe très professionnelle. Je recommande vivement !"
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                  T
                </div>
                <div>
                  <p className="font-semibold text-black">Thomas L.</p>
                  <div className="flex text-yellow-400">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-700">
                "Parfait pour notre mariage ! Installation rapide, son de qualité et technicien très à l'écoute."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      {isStickyVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 px-6 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xl font-bold">
              {currentTexts.from} {basePrice}€ {currentTexts.perDay}
            </div>
            <div className="flex gap-4">
              <a
                href="/devis"
                className="inline-block bg-[#F2431E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-center"
              >
                {currentTexts.addToQuote}
              </a>
              <a
                href="tel:+33651084994"
                className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                📞 {currentTexts.call}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div id="faq-section" className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            {currentTexts.faq}
          </h2>
          <div className="space-y-4">
            {currentTexts.faqQuestions.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-4"
      >
        <span className="font-semibold text-black text-lg">{question}</span>
        <span className="text-2xl text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="text-gray-600 mt-2">
          {answer}
        </div>
      )}
    </div>
  );
}

