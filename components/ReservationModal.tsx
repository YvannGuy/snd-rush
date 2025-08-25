
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
        description: "Solution simple et efficace avec enceinte ANNY 10 Bluetooth pour vos événements.",
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
        tagline: "Le choix équilibré",
        description: "Solution complète avec micro sans fil pour une sonorisation professionnelle adaptée à tous vos événements.",
        price: "139€",
        originalPrice: "",
        duration: "/jour",
        popular: true,
        image: "https://readdy.ai/api/search-image?query=standard%20sound%20system%20with%20powerful%20speakers%20and%20wireless%20microphone%2C%20professional%20audio%20equipment%20setup%20in%20modern%20venue%2C%20black%20and%20white%20photography%20with%20red%20lighting%20accents&width=400&height=300&seq=standard-pack-modal&orientation=landscape",
        features: ["2 enceintes 500W", "Table de mixage 4 voies", "1 micro sans fil", "Pieds + câbles inclus", "Égaliseur intégré"],
        highlight: "Le + demandé",
        ideal: "Idéal pour 50-100 personnes"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "La qualité supérieure",
        description: "Système professionnel avec caisson de basses pour une expérience sonore immersive et puissante.",
        price: "169€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/201ad9cfef58b6b9553a19fa999690f2.jfif",
        features: ["2 enceintes 800W + caisson", "Table de mixage 6 voies", "2 micros sans fil", "Éclairage LED inclus", "Installation incluse"],
        highlight: "Qualité Pro",
        ideal: "Idéal pour 100-200 personnes"
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
        tagline: "L'excellence absolue",
        description: "Système haut de gamme avec équipement premium et service VIP pour des événements d'exception.",
        price: "319€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/fddc9abdeba1d6e4aff14662a1c018a0.jfif",
        features: ["Système line array 1500W", "Console numérique", "4 micros sans fil premium", "Éclairage scénique", "Ingénieur du son", "Enregistrement HD"],
        highlight: "Haut de gamme",
        ideal: "Idéal pour 250-500 personnes"
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
        image: "/platinedj.jpg",
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
        image: "/platinedj4.jpg",
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
        image: "/platinedj2.jpg",
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
        image: "/platinedj3.jpg",
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
        description: "Simple and effective solution with ANNY 10 Bluetooth speaker for your events.",
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
        tagline: "The balanced choice",
        description: "Complete solution with wireless microphone for professional sound suited to all your events.",
        price: "139€",
        originalPrice: "",
        duration: "/day",
        popular: true,
        image: "https://readdy.ai/api/search-image?query=standard%20sound%20system%20with%20powerful%20speakers%20and%20wireless%20microphone%2C%20professional%20audio%20equipment%20setup%20in%20modern%20venue%2C%20black%20and%20white%20photography%20with%20red%20lighting%20accents&width=400&height=300&seq=standard-pack-modal&orientation=landscape",
        features: ["2 speakers 500W", "4-channel mixing table", "1 wireless microphone", "Stands + cables included", "Integrated equalizer"],
        highlight: "Most requested",
        ideal: "Ideal for 50-100 people"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Superior quality",
        description: "Professional system with subwoofer for an immersive and powerful sound experience.",
        price: "169€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/201ad9cfef58b6b9553a19fa999690f2.jfif",
        features: ["2 speakers 800W + subwoofer", "6-channel mixing table", "2 wireless microphones", "LED lighting included", "Installation included"],
        highlight: "Pro Quality",
        ideal: "Ideal for 100-200 people"
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
        tagline: "Absolute excellence",
        description: "High-end system with premium equipment and VIP service for exceptional events.",
        price: "319€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/fddc9abdeba1d6e4aff14662a1c018a0.jfif",
        features: ["Line array system 1500W", "Digital console", "4 premium wireless mics", "Stage lighting", "Sound engineer", "HD recording"],
        highlight: "High-end",
        ideal: "Ideal for 250-500 people"
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
        image: "/platinedj.jpg",
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
        image: "/platinedj4.jpg",
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
        image: "/platinedj2.jpg",
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
        image: "/platinedj3.jpg",
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">
            {texts[language].title}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
  
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
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
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h2 className="text-3xl font-bold text-black mb-4">
                {texts[language].successTitle}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {texts[language].successMessage}
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">{texts[language].orderNumber}:</span>
                  <span className="font-bold text-black">
                    #REQ{Math.floor(Math.random() * 10000)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{selectedPack?.name}:</span>
                  <span className="font-bold text-[#F2431E]">
                    {selectedPack?.price}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="bg-[#F2431E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
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