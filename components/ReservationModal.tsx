
'use client';

import { useState, useEffect } from 'react';
import PersonalInfoStep from './reservation/PersonalInfoStep';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  preselectedPackId?: number;
}

export default function ReservationModal({ isOpen, onClose, language, preselectedPackId }: ReservationModalProps) {
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const texts = {
    fr: {
      title: 'Demande de réservation',
      close: 'Fermer',
      successTitle: 'Demande envoyée !',
      successMessage: 'Votre demande de réservation a été envoyée avec succès. Nous vous contacterons rapidement pour confirmer votre réservation.',
      orderNumber: 'Numéro de demande'
    },
    en: {
      title: 'Reservation request',
      close: 'Close',
      successTitle: 'Request sent!',
      successMessage: 'Your reservation request has been sent successfully. We will contact you shortly to confirm your reservation.',
      orderNumber: 'Request number'
    }
  };

  const packs = {
    fr: [
      {
        id: 1,
        name: "Enceinte Starter",
        tagline: "Enceinte Bluetooth professionnelle",
        description: "Solution simple et efficace avec enceinte sans fil pour vos événements.",
        price: "109€",
        originalPrice: "",
        duration: " TTC / jour",
        popular: false,
        image: "/enceintebt.jpg",
        features: ["1x Enceinte active ANNY 10 – Bluetooth intégrée", "Connexion simple : Bluetooth, câble Jack ou RCA", "Option : Micro filaire ou sans fil (+10 €)", "Câblage inclus"],
        highlight: "Starter",
        ideal: "Idéal pour petits événements"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Jusqu'à 150 personnes",
        description: "Sonorisation professionnelle complète avec installation et technicien inclus.",
        price: "À partir de 550 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: true,
        image: "/packs.png",
        features: [
          "Sonorisation pour 150 pers",
          "1 micro filaire",
          "Livraison & Reprise",
          "Installation & réglages par technicien",
          "Démontage après l'événement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 150 personnes"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Jusqu'à 250 personnes",
        description: "Système professionnel complet avec assistance technique pendant l'événement.",
        price: "À partir de 700 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: false,
        image: "/packM.png",
        features: [
          "Sonorisation 250 pers",
          "2 micros filaires",
          "Livraison & Reprise",
          "Installation + assistance technicien",
          "Démontage complet"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 250 personnes"
      },
      {
        id: 4,
        name: "Pack CONFORT",
        tagline: "Le service complet",
        description: "Solution tout-en-un avec technicien dédié pour une tranquillité d'esprit absolue pendant votre événement.",
        price: "229€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=complete%20sound%20system%20with%20technician%20support%2C%20professional%20audio%20setup%20with%20multiple%20speakers%20and%20mixing%20equipment%2C%20service-oriented%20event%20venue%2C%20black%20and%20white%20photography%20with%20warm%20red%20accents&width=400&height=300&seq=confort-pack-modal&orientation=landscape",
        features: ["Système complet 1000W", "Technicien sur site", "3 micros sans fil", "Éclairage professionnel", "Réglages personnalisés", "Support technique"],
        highlight: "Service +",
        ideal: "Idéal pour 150-300 personnes"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Jusqu'à 500 personnes",
        description: "Configuration maximale avec supervision technique pendant l'événement.",
        price: "À partir de 1 100 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: false,
        image: "/packL.png",
        features: [
          "Sonorisation pro 500 pers",
          "2 micros sans fil",
          "Livraison & Reprise en camion",
          "Installation complète + assistance technicien",
          "Démontage & rangement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 500 personnes"
      },

      {
        id: 201,
        name: "DJ Compact",
        tagline: "Contrôleur DJ tout-en-un professionnel",
        description: "Solution DJ complète avec contrôleur Pioneer XDJ-RR pour vos performances.",
        price: "99€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packs.png",
        features: ["1x Contrôleur Pioneer XDJ-RR (tout-en-un)", "Équipement professionnel", "Câblage inclus", "Prêt à l'emploi"],
        highlight: "Compact",
        ideal: "Idéal pour débuter"
      },
      {
        id: 202,
        name: "Pack DJ Compact + DJ Booth",
        tagline: "DJ Compact avec stand professionnel",
        description: "Solution DJ complète avec contrôleur Pioneer XDJ-RR et DJ Booth professionnel.",
        price: "149€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packL.png",
        features: ["1x Contrôleur Pioneer XDJ-RR (platines + table intégrée)", "1x DJ Booth (stand pro) – structure stable et esthétique", "Câblage inclus"],
        highlight: "Booth",
        ideal: "Idéal pour événements"
      },
      {
        id: 203,
        name: "Pack Sono Standard DJ",
        tagline: "DJ + Sonorisation complète",
        description: "Pack complet avec contrôleur DJ et système de sonorisation professionnel.",
        price: "199€",
        originalPrice: "",
        duration: " TTC",
        popular: true,
        image: "/packM.png",
        features: ["1x Pioneer XDJ-RR", "2x Enceintes actives (1000W chacune)", "Pieds + câblage inclus", "Système complet"],
        highlight: "Standard",
        ideal: "Idéal pour événements"
      },
      {
        id: 204,
        name: "Pack Sono Premium DJ",
        tagline: "L'excellence DJ avec sonorisation premium",
        description: "Configuration DJ premium avec caisson de basses pour des performances exceptionnelles.",
        price: "279€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packL.png",
        features: ["1x Pioneer XDJ-RR", "2x Enceintes actives (1000W chacune)", "1x Caisson de basses (1500W)", "Pieds + câblage inclus"],
        highlight: "Premium",
        ideal: "Professionnels confirmés"
      }
    ],
    en: [
      {
        id: 1,
        name: "Starter Speaker",
        tagline: "Professional Bluetooth speaker",
        description: "Simple and effective solution with wireless speaker for your events.",
        price: "109€",
        originalPrice: "",
        duration: " TTC / day",
        popular: false,
        image: "/enceintebt.jpg",
        features: ["1x Active ANNY 10 speaker – Built-in Bluetooth", "Simple connection: Bluetooth, Jack cable or RCA", "Option: Wired or wireless microphone (+10 €)", "Cabling included"],
        highlight: "Starter",
        ideal: "Perfect for small events"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Up to 150 people",
        description: "Complete professional sound system with installation and technician included.",
        price: "À partir de 550 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: true,
        image: "/packs.png",
        features: [
          "Sound system for 150 people",
          "1 wired microphone",
          "Delivery & Pickup",
          "Installation & tuning by technician",
          "Dismantling after event"
        ],
        highlight: "Turnkey",
        ideal: "Up to 150 people"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Up to 250 people",
        description: "Complete professional system with technical assistance during the event.",
        price: "À partir de 700 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: false,
        image: "/packM.png",
        features: [
          "Sound system for 250 people",
          "2 wired microphones",
          "Delivery & Pickup",
          "Installation + technician assistance",
          "Complete dismantling"
        ],
        highlight: "Turnkey",
        ideal: "Up to 250 people"
      },
      {
        id: 4,
        name: "Pack COMFORT",
        tagline: "Complete service",
        description: "All-in-one solution with dedicated technician for absolute peace of mind during your event.",
        price: "229€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=complete%20sound%20system%20with%20technician%20support%2C%20professional%20audio%20setup%20with%20multiple%20speakers%20and%20mixing%20equipment%2C%20service-oriented%20event%20venue%2C%20black%20and%20white%20photography%20with%20warm%20red%20accents&width=400&height=300&seq=confort-pack-modal&orientation=landscape",
        features: ["Complete 1000W system", "On-site technician", "3 wireless microphones", "Professional lighting", "Custom settings", "Technical support"],
        highlight: "Service +",
        ideal: "Ideal for 150-300 people"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Up to 500 people",
        description: "Maximum configuration with technical supervision during the event.",
        price: "À partir de 1 100 € TTC",
        originalPrice: "",
        duration: "Paris intra-muros",
        popular: false,
        image: "/packL.png",
        features: [
          "Professional sound system for 500 people",
          "2 wireless microphones",
          "Delivery & Pickup by truck",
          "Complete installation + technician assistance",
          "Dismantling & storage"
        ],
        highlight: "Turnkey",
        ideal: "Up to 500 people"
      },

      {
        id: 201,
        name: "DJ Compact",
        tagline: "Professional all-in-one DJ controller",
        description: "Complete DJ solution with Pioneer XDJ-RR controller for your performances.",
        price: "99€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packs.png",
        features: ["1x Pioneer XDJ-RR controller (all-in-one)", "Professional equipment", "Cabling included", "Ready to use"],
        highlight: "Compact",
        ideal: "Perfect for beginners"
      },
      {
        id: 202,
        name: "DJ Compact + DJ Booth Pack",
        tagline: "DJ Compact with professional stand",
        description: "Complete DJ solution with Pioneer XDJ-RR controller and professional DJ Booth.",
        price: "149€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packL.png",
        features: ["1x Pioneer XDJ-RR controller (turntables + integrated table)", "1x DJ Booth (pro stand) – stable and aesthetic structure", "Cabling included"],
        highlight: "Booth",
        ideal: "Perfect for events"
      },
      {
        id: 203,
        name: "Standard Sound DJ Pack",
        tagline: "DJ + Complete Sound System",
        description: "Complete pack with DJ controller and professional sound system.",
        price: "199€",
        originalPrice: "",
        duration: " TTC",
        popular: true,
        image: "/packM.png",
        features: ["1x Pioneer XDJ-RR", "2x Active speakers (1000W each)", "Stands + cabling included", "Complete system"],
        highlight: "Standard",
        ideal: "Perfect for events"
      },
      {
        id: 204,
        name: "Premium Sound DJ Pack",
        tagline: "DJ excellence with premium sound",
        description: "Premium DJ configuration with subwoofer for exceptional performances.",
        price: "279€",
        originalPrice: "",
        duration: " TTC",
        popular: false,
        image: "/packL.png",
        features: ["1x Pioneer XDJ-RR", "2x Active speakers (1000W each)", "1x Subwoofer (1500W)", "Stands + cabling included"],
        highlight: "Premium",
        ideal: "Confirmed professionals"
      }
    ]
  };

  const handlePersonalInfoSubmit = async (info: any) => {
    // Préparer les données à envoyer à l'API
    const payload = {
      firstName: info.firstName,
      lastName: info.lastName,
      email: info.email,
      phone: info.phone,
      address: info.address,
      city: info.city,
      postalCode: info.postalCode,
      eventDate: info.eventDate,
      eventTime: info.eventTime,
      guestCount: info.guestCount,
      eventType: info.eventType,
      specialRequests: info.specialRequests,
      reservationType: info.reservationType,
      deliveryType: info.deliveryType,
      selectedPack: selectedPack
    };
  
    try {
      const res = await fetch('/api/sendReservationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        setIsSubmitted(true);
  
        // ✅ Déclencher le suivi de conversion Google Ads
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17395859907/h0GECIKj3vkaEMOD_-ZA',
          });
        }
      } else {
        alert("Erreur lors de l'envoi du message.");
      }
    } catch (e) {
      alert("Erreur lors de l'envoi du message.");
    }
  };
  
  useEffect(() => {
    if (preselectedPackId && isOpen) {
      const pack = packs[language].find((p) => p.id === preselectedPackId);
      if (pack) {
        setSelectedPack(pack);
      }
    }
  }, [preselectedPackId, isOpen, language]);
  
  const handleClose = () => {
    setSelectedPack(null);
    setIsSubmitted(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:w-full sm:max-h-[90vh] sm:rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-black">
            {texts[language].title}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-lg sm:text-xl"></i>
          </button>
        </div>
  
        {/* Content */}
        <div className="overflow-y-auto h-full sm:max-h-[calc(90vh-80px)]">
          {!isSubmitted ? (
            <PersonalInfoStep
              language={language}
              onSubmit={handlePersonalInfoSubmit}
              onBack={handleClose}
              onClose={handleClose}
              initialData={{}}
              selectedPack={selectedPack}
            />
          ) : (
            <div className="p-4 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-check-line text-2xl sm:text-3xl text-green-600"></i>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4">
                {texts[language].successTitle}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-2">
                {texts[language].successMessage}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-md mx-auto">
                <div className="flex justify-between items-center mb-3 sm:mb-4 text-sm sm:text-base">
                  <span className="text-gray-600">{texts[language].orderNumber}:</span>
                  <span className="font-bold text-black">
                    #REQ{Math.floor(Math.random() * 10000)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-600">{selectedPack?.name}:</span>
                  <span className="font-bold text-[#F2431E]">
                    {selectedPack?.price}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="bg-[#F2431E] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors w-full sm:w-auto"
              >
                {texts[language].close}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}