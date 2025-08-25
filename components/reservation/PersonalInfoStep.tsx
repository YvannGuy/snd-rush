
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
      depositDescription: 'Versement d\'un acompte de 30 % pour garantir et bloquer votre créneau'
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
      depositDescription: 'Payment of a 30% deposit to guarantee and secure your slot'
    }
  };

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

  // Liens Stripe pour chaque pack
  const stripeLinks = {
    'Enceinte Starter': 'https://buy.stripe.com/9B69ATfDMdYj8CZ42K1sQ0h',
    'Starter Speaker': 'https://buy.stripe.com/9B69ATfDMdYj8CZ42K1sQ0h',
    'Pack STANDARD': 'https://buy.stripe.com/3cIbJ1dvE6vR4mJ42K1sQ0i',
    'Pack PREMIUM': 'https://buy.stripe.com/aFa5kD63cf2nf1n1UC1sQ0j',
    'Pack PRESTIGE': 'https://buy.stripe.com/28E9AT8bkdYj3iF7eW1sQ0k',
    'DJ Compact': 'https://buy.stripe.com/cNi28rfDM7zVbPbczg1sQ0d',
    'Pack DJ Compact + DJ Booth': 'https://buy.stripe.com/fZu14n63c1bxdXjczg1sQ0e',
    'DJ Compact + DJ Booth Pack': 'https://buy.stripe.com/fZu14n63c1bxdXjczg1sQ0e',
    'Pack Sono Standard DJ': 'https://buy.stripe.com/28E00j4Z8cUf06tfLs1sQ0f',
    'Standard Sound DJ Pack': 'https://buy.stripe.com/28E00j4Z8cUf06tfLs1sQ0f',
    'Pack Sono Premium DJ': 'https://buy.stripe.com/aFaeVd3V4aM7dXj8j01sQ0g',
    'Premium Sound DJ Pack': 'https://buy.stripe.com/aFaeVd3V4aM7dXj8j01sQ0g'
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

        // Ouvrir Stripe dans une popup après un délai plus long
        setTimeout(() => {
          const stripeLink = stripeLinks[selectedPack.name as keyof typeof stripeLinks];
          console.log('Lien Stripe:', stripeLink);
          if (stripeLink && stripeLink !== '#') {
            console.log('Ouverture de Stripe en popup...');
            window.open(stripeLink, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
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
        
        setTimeout(() => {
          const stripeLink = stripeLinks[selectedPack.name as keyof typeof stripeLinks];
          if (stripeLink && stripeLink !== '#') {
            window.open(stripeLink, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
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
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-black mb-4">
          {texts[language].title}
        </h2>
        <p className="text-gray-600 text-lg">
          {texts[language].subtitle}
        </p>
      </div>

      {/* Pack sélectionné */}
      {selectedPack && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-black mb-2">
              {texts[language].selectedPack}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black">{selectedPack.name}</p>
                <p className="text-sm text-gray-600">{selectedPack.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#F2431E]">{selectedPack.price}</p>
                {selectedPack.duration && (
                  <p className="text-sm text-gray-500">{selectedPack.duration}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Calendrier de disponibilité */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
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
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black mb-6 flex items-center">
            <i className="ri-shield-check-line mr-2 text-[#F2431E]"></i>
            {texts[language].reservationType}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Réservation simple */}
            <div
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
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

            {/* Réservation avec acompte */}
            <div
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
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
                    {selectedPack ? `${Math.round(parseInt(selectedPack.price.replace(/[^\d]/g, '')) * 0.3)}€` : '30%'}
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
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Informations personnelles */}
        <div>
          <h3 className="text-xl font-semibold text-black mb-6 flex items-center">
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
        <div>
          <h3 className="text-xl font-semibold text-black mb-6 flex items-center">
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
        <div>
          <h3 className="text-xl font-semibold text-black mb-6 flex items-center">
            <i className="ri-truck-line mr-2 text-[#F2431E]"></i>
            {texts[language].deliveryType}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Livraison */}
            <div
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
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
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
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

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            {texts[language].back}
          </button>
          
          <button
            type="submit"
            disabled={false}
            className="flex-1 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {formData.reservationType === 'acompte' && selectedPack ? (
              <div className="flex flex-col items-center">
                <span>{texts[language].continue}</span>
                <span className="text-sm opacity-90">
                  Acompte : {Math.round(parseInt(selectedPack.price.replace(/[^\d]/g, '')) * 0.3)}€
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              
              <h2 className="text-2xl font-bold text-black mb-4">
                Demande envoyée !
              </h2>
              
              <p className="text-gray-600 mb-6">
                Votre demande de réservation avec acompte a été envoyée avec succès. La page de paiement Stripe va s'ouvrir dans une popup.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
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
                className="bg-[#F2431E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
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