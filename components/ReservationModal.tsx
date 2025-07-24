
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
        name: "Pack BASIC",
        tagline: "L'essentiel pour débuter",
        description: "Équipement sonore de base parfait pour les petits événements et réunions intimes.",
        price: "89€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["2 enceintes actives 300W", "Table de mixage 2 voies", "Pieds d'enceintes", "Câbles audio inclus", "Configuration simple"],
        highlight: "Essentiel",
        ideal: "Idéal pour 20-50 personnes"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Le choix équilibré",
        description: "Solution complète avec micro sans fil pour une sonorisation professionnelle adaptée à tous vos événements.",
        price: "129€",
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
        id: 6,
        name: "Pack LUXE",
        tagline: "Sur mesure et exclusif",
        description: "Solution personnalisée avec équipement de studio et équipe technique complète pour des événements uniques.",
        price: "Sur devis",
        originalPrice: "",
        duration: "",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=luxury%20sound%20system%20with%20studio-grade%20equipment%20and%20professional%20lighting%20setup%2C%20exclusive%20high-end%20audio%20installation%20in%20premium%20venue%2C%20artistic%20black%20and%20white%20photography%20with%20dramatic%20red%20lighting&width=400&height=300&seq=luxe-pack-modal&orientation=landscape",
        features: ["Système sur mesure", "Équipe technique complète", "Micros studio", "Éclairage architectural", "Régie mobile", "Service concierge"],
        highlight: "Exclusif",
        ideal: "Événements sur mesure"
      }
    ],
    en: [
      {
        id: 1,
        name: "Pack BASIC",
        tagline: "The essential to get started",
        description: "Basic sound equipment perfect for small events and intimate meetings.",
        price: "89€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["2 active speakers 300W", "2-channel mixing table", "Speaker stands", "Audio cables included", "Simple setup"],
        highlight: "Essential",
        ideal: "Ideal for 20-50 people"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "The balanced choice",
        description: "Complete solution with wireless microphone for professional sound suited to all your events.",
        price: "129€",
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
        id: 6,
        name: "Pack LUXURY",
        tagline: "Custom and exclusive",
        description: "Personalized solution with studio equipment and complete technical team for unique events.",
        price: "Quote",
        originalPrice: "",
        duration: "",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=luxury%20sound%20system%20with%20studio-grade%20equipment%20and%20professional%20lighting%20setup%2C%20exclusive%20high-end%20audio%20installation%20in%20premium%20venue%2C%20artistic%20black%20and%20white%20photography%20with%20dramatic%20red%20lighting&width=400&height=300&seq=luxe-pack-modal&orientation=landscape",
        features: ["Custom system", "Complete technical team", "Studio microphones", "Architectural lighting", "Mobile control room", "Concierge service"],
        highlight: "Exclusive",
        ideal: "Custom events"
      }
    ]
  };

  const handlePersonalInfoSubmit = async (info: any) => {
    // Préparer les données à envoyer à l'API
    const payload = {
      nom: info.lastName,
      prenom: info.firstName,
      email: info.email,
      telephone: info.phone,
      date: info.eventDate,
      heure: info.eventTime,
      adresse: `${info.address}, ${info.city} ${info.postalCode}`,
      message: `Type d'événement : ${info.eventType}\nNombre d'invités : ${info.guestCount}\nDemandes spéciales : ${info.specialRequests || ''}\nPack sélectionné : ${selectedPack?.name || ''}`
    };
    try {
      const res = await fetch('/api/sendReservationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        alert('Erreur lors de l\'envoi du message.');
      }
    } catch (e) {
      alert('Erreur lors de l\'envoi du message.');
    }
  };

  useEffect(() => {
    if (preselectedPackId && isOpen) {
      const pack = packs[language].find(p => p.id === preselectedPackId);
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
                  <span className="font-bold text-black">#REQ{Math.floor(Math.random() * 10000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{selectedPack?.name}:</span>
                  <span className="font-bold text-[#F2431E]">{selectedPack?.price}</span>
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
