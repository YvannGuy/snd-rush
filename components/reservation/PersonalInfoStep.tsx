
'use client';

import { useState, useEffect } from 'react';

interface PersonalInfoStepProps {
  language: 'fr' | 'en';
  onSubmit: (data: any) => void;
  onBack: () => void;
  onClose?: () => void;
  initialData: any;
  selectedPack?: any;
}

export default function PersonalInfoStep({ language, onSubmit, onBack, onClose, initialData = {}, selectedPack }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    postalCode: initialData.postalCode || '',
    eventDate: initialData.eventDate || '',
    eventTime: initialData.eventTime || '',
    guestCount: initialData.guestCount || '',
    eventType: initialData.eventType || '',
    specialRequests: initialData.specialRequests || '',
    reservationType: initialData.reservationType || 'simple', // 'simple' ou 'acompte'
    deliveryType: initialData.deliveryType || 'livraison' // 'livraison' ou 'recuperation'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestNumber, setRequestNumber] = useState('');
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('paris');

  // Forcer la sélection de "Réservation simple" quand zone "devis" est sélectionnée
  useEffect(() => {
    if (selectedZone === 'devis') {
      setFormData(prev => ({ ...prev, reservationType: 'simple' }));
    }
  }, [selectedZone]);

  // Fermer le tooltip quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.pricing-tooltip-container')) {
        setShowPricingTooltip(false);
      }
    };

    if (showPricingTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPricingTooltip]);

  // Fonction centralisée pour calculer l'acompte
  const calculateAcompte = (packPrice: string) => {
    // Extraire le prix numérique (gérer "À partir de 550 € TTC")
    const priceMatch = packPrice.match(/(\d+)/);
    const basePrice = priceMatch ? parseInt(priceMatch[1]) : 0;
    return Math.round(basePrice * 0.3); // 30% d'acompte
  };

  // Fonction pour obtenir le prix selon la zone sélectionnée
  const getPriceByZone = (packId: number, zone: string) => {
    const zonePrices = {
      2: { // Pack STANDARD
        paris: 550,
        petite: 630,
        moyenne: 710,
        grande: 750,
        devis: null
      },
      3: { // Pack PREMIUM
        paris: 700,
        petite: 780,
        moyenne: 860,
        grande: 900,
        devis: null
      },
      5: { // Pack PRESTIGE
        paris: 1100,
        petite: 1180,
        moyenne: 1260,
        grande: 1300,
        devis: null
      }
    };
    
    return zonePrices[packId as keyof typeof zonePrices]?.[zone as keyof typeof zonePrices[2]] || null;
  };

  // Fonction pour obtenir le nom de la zone
  const getZoneName = (zone: string) => {
    const zoneNames = {
      paris: language === 'fr' ? 'Paris intra-muros' : 'Paris intra-muros',
      petite: language === 'fr' ? 'Petite couronne (0–15 km)' : 'Inner suburbs (0–15 km)',
      moyenne: language === 'fr' ? 'Moyenne couronne (15–30 km)' : 'Outer suburbs (15–30 km)',
      grande: language === 'fr' ? 'Grande couronne (30–50 km)' : 'Greater Paris (30–50 km)',
      devis: language === 'fr' ? 'Au-delà de 50 km' : 'Beyond 50 km'
    };
    return zoneNames[zone as keyof typeof zoneNames] || '';
  };

  // Fonction pour obtenir les tarifs par zones selon l'ID du pack
  const getPricingZones = (packId: number) => {
    const pricingZones = {
      2: { // Pack STANDARD
        fr: [
          ["Paris intra-muros", "550 € TTC"],
          ["Petite couronne (0–15 km)", "630 € TTC"],
          ["Moyenne couronne (15–30 km)", "710 € TTC"],
          ["Grande couronne (30–50 km)", "750 € TTC"],
          ["Au-delà de 50 km", "Sur devis"]
        ],
        en: [
          ["Paris intra-muros", "550 € TTC"],
          ["Inner suburbs (0–15 km)", "630 € TTC"],
          ["Outer suburbs (15–30 km)", "710 € TTC"],
          ["Greater Paris (30–50 km)", "750 € TTC"],
          ["Beyond 50 km", "Quote on request"]
        ]
      },
      3: { // Pack PREMIUM
        fr: [
          ["Paris intra-muros", "700 € TTC"],
          ["Petite couronne (0–15 km)", "780 € TTC"],
          ["Moyenne couronne (15–30 km)", "860 € TTC"],
          ["Grande couronne (30–50 km)", "900 € TTC"],
          ["Au-delà de 50 km", "Sur devis"]
        ],
        en: [
          ["Paris intra-muros", "700 € TTC"],
          ["Inner suburbs (0–15 km)", "780 € TTC"],
          ["Outer suburbs (15–30 km)", "860 € TTC"],
          ["Greater Paris (30–50 km)", "900 € TTC"],
          ["Beyond 50 km", "Quote on request"]
        ]
      },
      5: { // Pack PRESTIGE
        fr: [
          ["Paris intra-muros", "1 100 € TTC"],
          ["Petite couronne (0–15 km)", "1 180 € TTC"],
          ["Moyenne couronne (15–30 km)", "1 260 € TTC"],
          ["Grande couronne (30–50 km)", "1 300 € TTC"],
          ["Au-delà de 50 km", "Sur devis"]
        ],
        en: [
          ["Paris intra-muros", "1 100 € TTC"],
          ["Inner suburbs (0–15 km)", "1 180 € TTC"],
          ["Outer suburbs (15–30 km)", "1 260 € TTC"],
          ["Greater Paris (30–50 km)", "1 300 € TTC"],
          ["Beyond 50 km", "Quote on request"]
        ]
      }
    };
    
    return pricingZones[packId as keyof typeof pricingZones]?.[language] || [];
  };

  // Fermer le tooltip quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.pricing-tooltip-container')) {
        setShowPricingTooltip(false);
      }
    };

    if (showPricingTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPricingTooltip]);


  // Dates d'indisponibilité (exemple - à adapter selon vos besoins)
  const unavailableDates = [
    '2024-09-20', // 20 septembre indisponible
  ];

  // Dates avec disponibilité limitée (exemple)
  const limitedAvailabilityDates: string[] = [
    // Aucune date avec disponibilité limitée pour l'instant
  ];

  const texts = {
    fr: {
      title: 'Vos informations personnelles',
      subtitle: 'Remplissez vos coordonnées pour finaliser votre réservation',
      personalInfo: 'Informations personnelles',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      eventInfo: 'Détails de l\'événement',
      address: 'Adresse de l\'événement',
      city: 'Ville',
      postalCode: 'Code postal',
      eventDate: 'Date de l\'événement',
      eventTime: 'Heure de début',
      guestCount: 'Nombre d\'invités',
      eventType: 'Type d\'événement',
      specialRequests: 'Demandes spéciales',
      selectedPack: 'Pack sélectionné',
      back: 'Retour',
      continue: 'Continuer',
      required: 'Obligatoire',
      emailPlaceholder: 'votre@email.com',
      phonePlaceholder: '06 12 34 56 78',
      addressPlaceholder: '123 rue de la Paix',
      cityPlaceholder: 'Paris',
      postalCodePlaceholder: '75001',
      eventTypePlaceholder: 'Mariage, anniversaire, conférence...',
      specialRequestsPlaceholder: 'Besoins spécifiques, contraintes techniques...',
      errorRequired: 'Ce champ est obligatoire',
      errorEmail: 'Email invalide',
      errorPhone: 'Téléphone invalide',
      errorPostalCode: 'Code postal invalide',
      errorGuestCount: 'Nombre invalide',
      reservationType: 'Type de réservation',
      deliveryType: 'Mode de récupération',
      delivery: 'Livraison',
      pickup: 'Récupération sur place',
      deliveryDescription: 'Livraison à votre adresse',
      pickupDescription: 'Récupération dans nos locaux',
      simpleReservation: 'Réservation simple',
      depositReservation: 'Réservation avec acompte',
      simpleDescription: 'Réservation sans acompte',
      depositDescription: 'Versement d\'un acompte de 30 % pour garantir et bloquer votre créneau',
      errorPaymentCreation: 'Erreur lors de la création du paiement. Veuillez réessayer.'
    },
    en: {
      title: 'Your personal information',
      subtitle: 'Fill in your details to finalize your reservation',
      personalInfo: 'Personal information',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      eventInfo: 'Event details',
      address: 'Event address',
      city: 'City',
      postalCode: 'Postal code',
      eventDate: 'Event date',
      eventTime: 'Start time',
      guestCount: 'Number of guests',
      eventType: 'Event type',
      specialRequests: 'Special requests',
      selectedPack: 'Selected pack',
      back: 'Back',
      continue: 'Continue',
      required: 'Required',
      emailPlaceholder: 'your@email.com',
      phonePlaceholder: '+33 6 12 34 56 78',
      addressPlaceholder: '123 Peace Street',
      cityPlaceholder: 'Paris',
      postalCodePlaceholder: '75001',
      eventTypePlaceholder: 'Wedding, birthday, conference...',
      specialRequestsPlaceholder: 'Specific needs, technical constraints...',
      errorRequired: 'This field is required',
      errorEmail: 'Invalid email',
      errorPhone: 'Invalid phone number',
      errorPostalCode: 'Invalid postal code',
      errorGuestCount: 'Invalid number',
      reservationType: 'Reservation type',
      deliveryType: 'Pickup method',
      delivery: 'Delivery',
      pickup: 'Pickup on site',
      deliveryDescription: 'Delivery to your address',
      pickupDescription: 'Pickup at our premises',
      simpleReservation: 'Simple reservation',
      depositReservation: 'Reservation with deposit',
      simpleDescription: 'Reservation without deposit',
      depositDescription: 'Payment of a 30% deposit to guarantee and secure your slot',
      errorPaymentCreation: 'Error creating payment. Please try again.'
    }
  };

  const currentTexts = texts[language];

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return texts[language].errorRequired;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return texts[language].errorEmail;
        break;
      case 'phone':
        if (!value) return texts[language].errorRequired;
        if (!/^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(value.replace(/\s/g, ''))) return texts[language].errorPhone;
        break;
      case 'postalCode':
        if (!value) return texts[language].errorRequired;
        if (!/^\d{5}$/.test(value)) return texts[language].errorPostalCode;
        break;
      case 'guestCount':
        if (!value) return texts[language].errorRequired;
        if (isNaN(Number(value)) || Number(value) < 1) return texts[language].errorGuestCount;
        break;
      default:
        if (!value && ['firstName', 'lastName', 'address', 'city', 'eventDate', 'eventTime', 'eventType'].includes(name)) {
          return texts[language].errorRequired;
        }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatage automatique
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
    } else if (name === 'postalCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 5);
    } else if (name === 'guestCount') {
      formattedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Validation en temps réel
    const error = validateField(name, formattedValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Fonction pour créer une session Stripe dynamique
  const createStripeSession = async (packName: string, amount: number) => {
    try {
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          packName,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`
        }),
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        return data.url;
      } else {
        console.error('Erreur lors de la création de la session Stripe:', data.error);
        throw new Error(data.error || 'Erreur inconnue lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit appelé');
    console.log('formData:', formData);
    console.log('selectedPack:', selectedPack);
    console.log('selectedPack price:', selectedPack?.price);
    console.log('selectedPack name:', selectedPack?.name);
    console.log('reservationType:', formData.reservationType);
    
    // Validation simplifiée - seulement les champs essentiels
    const essentialFields = ['firstName', 'lastName', 'email', 'phone'];
    const newErrors: {[key: string]: string} = {};
    
    essentialFields.forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    console.log('Erreurs de validation:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('Formulaire invalide, arrêt');
      return;
    }

    // Si c'est une réservation avec acompte, envoyer un email de notification et ouvrir Stripe en popup
    if (formData.reservationType === 'acompte' && selectedPack) {
      console.log('Réservation avec acompte détectée');
      try {
        // Générer un numéro de demande
        const newRequestNumber = `#REQ${Math.floor(Math.random() * 9000) + 1000}`;
        setRequestNumber(newRequestNumber);
        
        // Envoyer un email de notification pour l'acompte
        console.log('Envoi de l\'email de notification...');
        const response = await fetch('/api/sendReservationEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            selectedPack,
            notificationType: 'deposit_intent',
            requestNumber: newRequestNumber
          }),
        });

        console.log('Réponse de l\'API:', response.status);

        // Afficher le modal de succès immédiatement
        setShowSuccessModal(true);

        // Fermer la fenêtre de réservation après un court délai
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 1000);

        // Créer une session Stripe dynamique
        setTimeout(async () => {
          const price = getPriceByZone(selectedPack.id, selectedZone);
          if (price) {
            const acompteAmount = Math.round(price * 0.3);
            console.log('Création de la session Stripe pour:', selectedPack.name, 'Montant:', acompteAmount);
            
            try {
              const stripeUrl = await createStripeSession(selectedPack.name, acompteAmount);
              
              if (stripeUrl) {
                console.log('Session Stripe créée, redirection vers:', stripeUrl);
            
            // Détecter si c'est un appareil mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
              // Sur mobile, rediriger directement
              console.log('Appareil mobile détecté, redirection directe vers Stripe');
                window.location.href = stripeUrl;
            } else {
              // Sur desktop, ouvrir en popup
              console.log('Appareil desktop détecté, ouverture en popup');
                const popup = window.open(stripeUrl, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
              
              // Vérifier si la popup a été bloquée
              if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                console.log('Popup bloquée, redirection directe');
                  window.location.href = stripeUrl;
                }
              }
            } else {
              console.error('Impossible de créer la session Stripe');
              alert(currentTexts.errorPaymentCreation);
            }
          } catch (error) {
            console.error('Erreur lors de la création de la session Stripe:', error);
            alert(currentTexts.errorPaymentCreation);
            }
          }
        }, 1500);

        return;
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
        // En cas d'erreur, afficher le modal et fermer la fenêtre
        setShowSuccessModal(true);
        
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 1000);
        
        setTimeout(async () => {
          const price = getPriceByZone(selectedPack.id, selectedZone);
          if (price) {
            const acompteAmount = Math.round(price * 0.3);
            const stripeUrl = await createStripeSession(selectedPack.name, acompteAmount);
            
            if (stripeUrl) {
            // Détecter si c'est un appareil mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
              // Sur mobile, rediriger directement
                window.location.href = stripeUrl;
            } else {
              // Sur desktop, ouvrir en popup
                const popup = window.open(stripeUrl, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
              
              // Vérifier si la popup a été bloquée
              if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                  window.location.href = stripeUrl;
                }
              }
            }
          }
        }, 1500);
      }
    }

    // Sinon, continuer avec le processus normal
    console.log('Continuation avec le processus normal');
    onSubmit(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'eventDate', 'eventTime', 'guestCount', 'eventType'];
    const isValid = requiredFields.every(field => formData[field as keyof typeof formData] && !errors[field]);
    
    console.log('Validation du formulaire:');
    console.log('Champs requis:', requiredFields);
    console.log('Données du formulaire:', formData);
    console.log('Erreurs:', errors);
    console.log('Formulaire valide:', isValid);
    
    return isValid;
  };

  // Définir la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

  // Fonctions pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateUnavailable = (date: string) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // getMonth() retourne 0-11
    const day = dateObj.getDate();
    const dayOfWeek = dateObj.getDay(); // 0 = dimanche, 6 = samedi
    
    // Seul le vendredi 19 septembre 2025 est indisponible
    if (year === 2025 && month === 9 && day === 19 && dayOfWeek === 5) {
      return true;
    }
    
    return unavailableDates.includes(date);
  };

  const isDateLimited = (date: string) => {
    return limitedAvailabilityDates.includes(date);
  };

  const isDatePast = (date: string) => {
    return new Date(date) < new Date(today);
  };

  const handleDateSelect = (date: string) => {
    if (isDateUnavailable(date) || isDatePast(date)) return;
    
    setFormData(prev => ({ ...prev, eventDate: date }));
    setShowCalendar(false);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newDate >= new Date(today)) {
      setCurrentMonth(newDate);
    }
  };

  const getMonthName = (date: Date) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[date.getMonth()];
  };

  return (
    <div className="p-4 sm:p-8 pb-8">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-3xl font-bold text-black mb-2 sm:mb-4">
          {texts[language].title}
        </h2>
        <p className="text-gray-600 text-sm sm:text-lg px-1 sm:px-2">
          {texts[language].subtitle}
        </p>
      </div>

      {/* Pack sélectionné */}
      {selectedPack && (
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-2">
              {texts[language].selectedPack}
            </h3>
            <div className="space-y-3">
              {/* Informations du pack */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black text-sm sm:text-base">{selectedPack.name}</p>
                <p className="text-xs sm:text-sm text-gray-600">{selectedPack.tagline}</p>
              </div>
              <div className="text-right">
                  {/* Sélecteur de zone moderne */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'fr' ? 'Zone de livraison' : 'Delivery zone'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        { key: 'paris', label: language === 'fr' ? 'Paris intra-muros' : 'Paris intra-muros' },
                        { key: 'petite', label: language === 'fr' ? 'Petite couronne' : 'Inner suburbs' },
                        { key: 'moyenne', label: language === 'fr' ? 'Moyenne couronne' : 'Outer suburbs' },
                        { key: 'grande', label: language === 'fr' ? 'Grande couronne' : 'Greater Paris' },
                        { key: 'devis', label: language === 'fr' ? 'Au-delà de 50 km' : 'Beyond 50 km' }
                      ].map((zone) => (
                        <button
                          key={zone.key}
                          onClick={() => setSelectedZone(zone.key)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                            selectedZone === zone.key
                              ? 'bg-[#F2431E] text-white border-[#F2431E]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#F2431E] hover:text-[#F2431E]'
                          }`}
                        >
                          {zone.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prix et acompte dynamiques */}
                  <div className="bg-gray-50 rounded-lg p-4 relative">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="text-2xl font-bold text-[#F2431E]">
                          {(() => {
                            const price = getPriceByZone(selectedPack.id, selectedZone);
                            return price ? `${price} € TTC` : (language === 'fr' ? 'Sur devis' : 'Quote on request');
                          })()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPricingTooltip(!showPricingTooltip);
                          }}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          aria-label="Informations sur les tarifs par zones"
                        >
                          <i className="ri-information-line text-lg"></i>
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {getZoneName(selectedZone)}
                      </div>
                      {(() => {
                        const price = getPriceByZone(selectedPack.id, selectedZone);
                        return price ? null : (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="text-sm text-orange-800 font-medium">
                              {language === 'fr' ? 'Devis personnalisé' : 'Custom quote'}
                            </div>
                            <div className="text-sm text-orange-600">
                              {language === 'fr' ? 'Contactez-nous pour un devis' : 'Contact us for a quote'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Tooltip avec les zones de livraison */}
                    {showPricingTooltip && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4 z-20 min-w-[280px] sm:min-w-[320px] max-w-[350px] sm:max-w-none pricing-tooltip-container">
                        <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                          {language === 'fr' ? 'Zone de livraison depuis notre entrepôt à Romainville' : 'Delivery zone from our warehouse in Romainville'}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs sm:text-sm">Paris intra-muros:</span>
                            <span className="font-semibold text-gray-800 text-xs sm:text-sm">550 € TTC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs sm:text-sm">Petite couronne (0–15 km):</span>
                            <span className="font-semibold text-gray-800 text-xs sm:text-sm">630 € TTC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs sm:text-sm">Moyenne couronne (15–30 km):</span>
                            <span className="font-semibold text-gray-800 text-xs sm:text-sm">710 € TTC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs sm:text-sm">Grande couronne (30–50 km):</span>
                            <span className="font-semibold text-gray-800 text-xs sm:text-sm">750 € TTC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs sm:text-sm">Au-delà de 50 km:</span>
                            <span className="font-semibold text-orange-600 text-xs sm:text-sm">Sur devis</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            {language === 'fr' 
                              ? '* Tarifs TTC, livraison incluse, installation disponible'
                              : '* All prices include tax, delivery and installation'
                            }
                          </div>
                        </div>
                        {/* Bouton de fermeture pour mobile */}
                        <button
                          onClick={() => setShowPricingTooltip(false)}
                          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 sm:hidden"
                          aria-label="Fermer"
                        >
                          <i className="ri-close-line text-sm"></i>
                        </button>
                      </div>
                    )}
                  </div>
              </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Calendrier de disponibilité */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-black mb-4 flex items-center">
            <i className="ri-calendar-line mr-2 text-[#F2431E]"></i>
            Calendrier de disponibilité
          </h3>
          
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="ri-calendar-line"></i>
              {showCalendar ? 'Masquer le calendrier' : 'Voir le calendrier de disponibilité'}
            </button>
          </div>

          {showCalendar && (
            <div className="border border-gray-200 rounded-lg p-4">
              {/* En-tête du calendrier */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="ri-arrow-left-line"></i>
                </button>
                <h4 className="text-lg font-semibold">
                  {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                </h4>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
                  const days = [];
                  
                  // Jours vides au début
                  for (let i = 0; i < startingDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-10"></div>);
                  }
                  
                  // Jours du mois
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateString = formatDate(date);
                    const isUnavailable = isDateUnavailable(dateString);
                    const isLimited = isDateLimited(dateString);
                    const isPast = isDatePast(dateString);
                    const isSelected = formData.eventDate === dateString;
                    
                    let className = "h-10 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-colors";
                    
                    if (isPast) {
                      className += " text-gray-300 cursor-not-allowed";
                    } else if (isUnavailable) {
                      className += " bg-red-100 text-red-600 cursor-not-allowed";
                    } else if (isLimited) {
                      className += " bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
                    } else if (isSelected) {
                      className += " bg-[#F2431E] text-white";
                    } else {
                      className += " hover:bg-gray-100";
                    }
                    
                    days.push(
                      <button
                        key={day}
                        onClick={() => handleDateSelect(dateString)}
                        disabled={isPast || isUnavailable}
                        className={className}
                        title={
                          isUnavailable ? 'Indisponible' :
                          isLimited ? 'Disponibilité limitée' :
                          isPast ? 'Date passée' :
                          'Disponible'
                        }
                      >
                        {day}
                      </button>
                    );
                  }
                  
                  return days;
                })()}
              </div>

              {/* Légende */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                  <span>Disponibilité limitée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span>Indisponible</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Type de réservation */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8 mobile-spacing">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-black mb-4 sm:mb-6 flex items-center">
            <i className="ri-shield-check-line mr-2 text-[#F2431E]"></i>
            {texts[language].reservationType}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Réservation simple */}
            <div
              className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                formData.reservationType === 'simple'
                  ? 'border-[#F2431E] bg-[#F2431E]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, reservationType: 'simple' }))}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.reservationType === 'simple'
                      ? 'border-[#F2431E] bg-[#F2431E]'
                      : 'border-gray-300'
                  }`}>
                    {formData.reservationType === 'simple' && (
                      <i className="ri-check-line text-white text-sm"></i>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg text-black">
                    {texts[language].simpleReservation}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">Gratuit</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {texts[language].simpleDescription}
              </p>
              <p className="text-gray-600 mb-4">
                Vous remplissez simplement vos informations et vous êtes recontacté dans les 24h
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <i className="ri-error-warning-line"></i>
                  <span>⚠️ Ce type de réservation ne bloque pas le créneau : la date reste disponible et peut être réservée par un autre client à moins de l'avoir bloqué avec un acompte</span>
                </div>
              </div>
            </div>

            {/* Réservation avec acompte - Masquée si zone "devis" */}
            {selectedZone !== 'devis' && (
            <div
              className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                formData.reservationType === 'acompte'
                  ? 'border-[#F2431E] bg-[#F2431E]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, reservationType: 'acompte' }))}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.reservationType === 'acompte'
                      ? 'border-[#F2431E] bg-[#F2431E]'
                      : 'border-gray-300'
                  }`}>
                    {formData.reservationType === 'acompte' && (
                      <i className="ri-check-line text-white text-sm"></i>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg text-black">
                    {texts[language].depositReservation}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#F2431E]">
                    {selectedPack ? (() => {
                      const price = getPriceByZone(selectedPack.id, selectedZone);
                      return price ? `${Math.round(price * 0.3)}€` : 'Sur devis';
                    })() : '30%'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {texts[language].depositDescription}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <i className="ri-shield-check-line"></i>
                  <span>Créneau prioritaire et sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <i className="ri-credit-card-line"></i>
                  <span>Paiement du solde à effectuer 72h avant l'événement</span>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Informations personnelles */}
        <div className="mobile-spacing">
          <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6 flex items-center">
            <i className="ri-user-line mr-2 text-[#F2431E]"></i>
            {texts[language].personalInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].firstName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].lastName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].email} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={texts[language].emailPlaceholder}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].phone} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={texts[language].phonePlaceholder}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Informations de l'événement */}
        <div className="mobile-spacing">
          <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6 flex items-center">
            <i className="ri-calendar-event-line mr-2 text-[#F2431E]"></i>
            {texts[language].eventInfo}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].eventType} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                placeholder={texts[language].eventTypePlaceholder}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.eventType ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].address} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={texts[language].addressPlaceholder}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                  errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                }`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].city} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder={texts[language].cityPlaceholder}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                    errors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                  }`}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].postalCode} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder={texts[language].postalCodePlaceholder}
                  maxLength={5}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                    errors.postalCode ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                  }`}
                />
                {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].eventDate} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  min={today}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                    errors.eventDate ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                  }`}
                />
                {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].eventTime} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                    errors.eventTime ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                  }`}
                />
                {errors.eventTime && <p className="text-red-500 text-sm mt-1">{errors.eventTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].guestCount} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  min="1"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-base transition-colors ${
                    errors.guestCount ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F2431E]'
                  }`}
                />
                {errors.guestCount && <p className="text-red-500 text-sm mt-1">{errors.guestCount}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts[language].specialRequests}
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder={texts[language].specialRequestsPlaceholder}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] resize-none text-base"
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {formData.specialRequests.length}/500
              </div>
            </div>
          </div>
        </div>

        {/* Mode de récupération */}
        <div className="mobile-spacing">
          <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6 flex items-center">
            <i className="ri-truck-line mr-2 text-[#F2431E]"></i>
            {texts[language].deliveryType}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Livraison */}
            <div
              className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                formData.deliveryType === 'livraison'
                  ? 'border-[#F2431E] bg-[#F2431E]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'livraison' }))}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  formData.deliveryType === 'livraison'
                    ? 'border-[#F2431E] bg-[#F2431E]'
                    : 'border-gray-300'
                }`}>
                  {formData.deliveryType === 'livraison' && (
                    <i className="ri-check-line text-white text-sm"></i>
                  )}
                </div>
                <h4 className="font-semibold text-lg text-black">
                  {texts[language].delivery}
                </h4>
              </div>
              
              <p className="text-gray-600 mb-4">
                {texts[language].deliveryDescription}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="ri-map-pin-line text-[#F2431E]"></i>
                <span>Livraison à l'adresse de l'événement</span>
              </div>
            </div>

            {/* Récupération sur place */}
            <div
              className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                formData.deliveryType === 'recuperation'
                  ? 'border-[#F2431E] bg-[#F2431E]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'recuperation' }))}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  formData.deliveryType === 'recuperation'
                    ? 'border-[#F2431E] bg-[#F2431E]'
                    : 'border-gray-300'
                }`}>
                  {formData.deliveryType === 'recuperation' && (
                    <i className="ri-check-line text-white text-sm"></i>
                  )}
                </div>
                <h4 className="font-semibold text-lg text-black">
                  {texts[language].pickup}
                </h4>
              </div>
              
              <p className="text-gray-600 mb-4">
                {texts[language].pickupDescription}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <i className="ri-store-line text-[#F2431E]"></i>
                <span>Récupération dans nos locaux</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-[#F2431E] h-2 rounded-full transition-all duration-300"
            style={{ width: `${isFormValid() ? '100' : '60'}%` }}
          ></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            {texts[language].back}
          </button>
          
          <button
            type="submit"
            disabled={false}
            className="flex-1 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
          >
            {formData.reservationType === 'acompte' && selectedPack ? (
              <div className="flex flex-col items-center">
                <span>{texts[language].continue}</span>
                <span className="text-sm opacity-90">
                  {language === 'fr' ? 'Acompte :' : 'Deposit:'} {(() => {
                    const price = getPriceByZone(selectedPack.id, selectedZone);
                    return price ? Math.round(price * 0.3) : 'Sur devis';
                  })()}€
                </span>
              </div>
            ) : (
              texts[language].continue
            )}
          </button>
        </div>
                      </form>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              
              <h2 className="text-2xl font-bold text-black mb-4">
                Demande envoyée !
              </h2>
              
              <p className="text-base text-gray-600 mb-6 px-2">
                Votre demande de réservation avec acompte a été envoyée avec succès. La page de paiement Stripe va s'ouvrir dans une popup.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de demande:</span>
                    <span className="font-bold text-black">{requestNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{selectedPack?.name}:</span>
                    <span className="font-bold text-[#F2431E]">{selectedPack?.price}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onClose) {
                    onClose();
                  }
                }}
                className="bg-[#F2431E] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}