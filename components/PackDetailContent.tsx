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
        id: 1,
        name: "Essentiel",
        tagline: "Solution basique pour petits événements",
        description: "Pack essentiel parfait pour les petits événements intérieurs jusqu'à 70 personnes.",
        priceParis: "300 € TTC",
        priceHorsParis: "300 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "2 enceintes pro",
          "1 micro",
          "Câblage complet",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "30 à 70 personnes",
        note: "Idéal pour petits événements intérieurs, réunions, anniversaires intimes."
      },
      {
        id: 2,
        name: "Standard",
        tagline: "Solution complète pour événements moyens",
        description: "Pack standard avec sonorisation complète pour événements jusqu'à 150 personnes.",
        priceParis: "450 € TTC",
        priceHorsParis: "450 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 enceintes + 1 caisson de basse",
          "2 micros",
          "Console de mixage",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "70 à 150 personnes",
        note: "Parfait pour événements moyens, mariages, conférences, soirées privées."
      },
      {
        id: 3,
        name: "Premium",
        tagline: "Solution professionnelle pour grands événements",
        description: "Pack premium avec équipement professionnel et technicien sur place pour événements jusqu'à 300 personnes.",
        priceParis: "650 € TTC",
        priceHorsParis: "650 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 enceintes + 2 caissons",
          "Console pro",
          "4 micros",
          "Technicien sur place",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "150 à 300 personnes",
        note: "Idéal pour grands événements, concerts, festivals, événements live/DJ."
      },
      {
        id: 5,
        name: "Événement",
        tagline: "Solution haut de gamme sur devis",
        description: "Pack événement avec sonorisation professionnelle complète pour très grands événements jusqu'à 600 personnes.",
        priceParis: "Sur devis",
        priceHorsParis: "Sur devis",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Sonorisation pro complète",
          "Micros HF & instruments",
          "Technicien & régie",
          "Logistique complète"
        ],
        highlight: "Clé en main",
        ideal: "300 à 600 personnes",
        note: "Parfait pour très grands événements, concerts, festivals, événements professionnels."
      }
    ],
    en: [
      {
        id: 1,
        name: "Essential",
        tagline: "Basic solution for small events",
        description: "Essential pack perfect for small indoor events up to 70 people.",
        priceParis: "300 € TTC",
        priceHorsParis: "300 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "2 pro speakers",
          "1 microphone",
          "Complete cabling",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "30 to 70 people",
        note: "Ideal for small indoor events, meetings, intimate birthdays."
      },
      {
        id: 2,
        name: "Standard",
        tagline: "Complete solution for medium events",
        description: "Standard pack with complete sound system for events up to 150 people.",
        priceParis: "450 € TTC",
        priceHorsParis: "450 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 speakers + 1 subwoofer",
          "2 microphones",
          "Mixing console",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "70 to 150 people",
        note: "Perfect for medium events, weddings, conferences, private parties."
      },
      {
        id: 3,
        name: "Premium",
        tagline: "Professional solution for large events",
        description: "Premium pack with professional equipment and on-site technician for events up to 300 people.",
        priceParis: "650 € TTC",
        priceHorsParis: "650 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 speakers + 2 subwoofers",
          "Pro console",
          "4 microphones",
          "On-site technician",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "150 to 300 people",
        note: "Ideal for large events, concerts, festivals, live/DJ events."
      },
      {
        id: 5,
        name: "Event",
        tagline: "High-end solution on quote",
        description: "Event pack with complete professional sound system for very large events up to 600 people.",
        priceParis: "On quote",
        priceHorsParis: "On quote",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Complete pro sound system",
          "Wireless mics & instruments",
          "Technician & control room",
          "Complete logistics"
        ],
        highlight: "Turnkey",
        ideal: "300 to 600 people",
        note: "Perfect for very large events, concerts, festivals, professional events."
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
  const extractPrice = (priceStr: string): number | null => {
    if (priceStr.toLowerCase().includes('devis') || priceStr.toLowerCase().includes('quote')) {
      return null;
    }
    const match = priceStr.match(/(\d+(?:\s?\d+)?)/);
    return match ? parseInt(match[1].replace(/\s/g, '')) : null;
  };

  const basePrice = pack ? extractPrice(pack.priceParis) : null;
  const hasPrice = basePrice !== null;

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
                Pack {pack.name}
                <br />
                <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-gray-600">
                  {capacity}
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {currentTexts.idealFor} {pack.note.split(' ').slice(-3).join(' ')}
              </p>
              
              <div className="text-4xl font-bold text-black mb-8">
                {hasPrice ? `${currentTexts.from} ${basePrice}€ ${currentTexts.perDay}` : pack.priceParis}
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
      {isStickyVisible && hasPrice && (
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

