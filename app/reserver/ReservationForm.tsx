
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReservationFormProps {
  language: 'fr' | 'en';
  packId: number;
  onBack: () => void;
}

export default function ReservationForm({ language, packId, onBack }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    eventAddress: '',
    eventCity: '',
    eventPostalCode: '',
    guestCount: '',
    specialRequests: '',
    reservationType: 'acompte', // 'acompte' ou 'info'
    acceptTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);

  const texts = {
    fr: {
      title: 'Finalisez votre réservation — Pack Clé en Main',
      subtitle: '✅ Tout est inclus : livraison, installation, technicien, démontage & reprise.\n✅ Zéro caution.\n✅ Acompte 30 % pour bloquer votre date en priorité.',
      selectedPack: 'Pack sélectionné',
      backToSelection: 'Retour à la sélection',
      personalInfo: 'Informations personnelles',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      eventDetails: 'Détails de l\'événement',
      eventType: 'Type d\'événement',
      eventDate: 'Date de l\'événement',
      eventTime: 'Heure de début',
      eventAddress: 'Adresse de l\'événement',
      eventCity: 'Ville',
      eventPostalCode: 'Code postal',
      guestCount: 'Nombre d\'invités',
      specialRequests: 'Demandes spéciales',
      reservationType: 'Type de réservation',
      infoRequest: 'Demande d\'information (sans acompte)',
      infoRequestText: 'Vous laissez vos coordonnées, on vous rappelle sous 24h. ⚠️ Le créneau n\'est pas bloqué tant que l\'acompte n\'est pas versé.',
      acompteReservation: 'Réservation clé en main (acompte 30 %)',
      acompteReservationText: 'Acompte de 30 % pour bloquer votre date. Créneau prioritaire et sécurisé. Solde à verser 72h avant l\'événement.',
      acceptTerms: 'J\'accepte les conditions générales',
      payAcompte: 'Payer l\'acompte et bloquer la date',
      sendRequest: 'Envoyer ma demande',
      submitting: 'Envoi en cours...',
      successTitle: 'Réservation confirmée !',
      successMessage: '✅ Merci ! Votre acompte est confirmé. Votre date est bloquée. Vous recevrez un récapitulatif par email et nous vous contactons sous 24h.',
      infoSuccessTitle: 'Demande envoyée !',
      infoSuccessMessage: 'Merci ! Nous vous recontactons sous 24h. ⚠️ Votre date n\'est pas encore bloquée — versez un acompte pour la sécuriser.',
      orderNumber: 'Numéro de commande',
      total: 'Total',
      acompteAmount: 'Acompte (30%)',
      eventTypeOptions: ['Mariage', 'Culte', 'Association', 'Entreprise', 'Anniversaire', 'Autre'],
      specialRequestsPlaceholder: 'Besoins spécifiques, contraintes techniques...',
      required: 'Obligatoire',
      horsParisNote: 'Hors Paris : +80 € transport (ajusté après adresse)',
      calendarButton: 'Voir le calendrier de disponibilité',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Hors Paris',
      transportFee: '+80 € transport'
    },
    en: {
      title: 'Complete your reservation — Turnkey Pack',
      subtitle: '✅ Everything included: delivery, installation, technician, dismantling & pickup.\n✅ Zero deposit.\n✅ 30% down payment to secure your date priority.',
      selectedPack: 'Selected pack',
      backToSelection: 'Back to selection',
      personalInfo: 'Personal information',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      eventDetails: 'Event details',
      eventType: 'Event type',
      eventDate: 'Event date',
      eventTime: 'Start time',
      eventAddress: 'Event address',
      eventCity: 'City',
      eventPostalCode: 'Postal code',
      guestCount: 'Number of guests',
      specialRequests: 'Special requests',
      reservationType: 'Reservation type',
      infoRequest: 'Information request (no down payment)',
      infoRequestText: 'You leave your contact details, we call you back within 24h. ⚠️ The slot is not blocked until the down payment is made.',
      acompteReservation: 'Turnkey reservation (30% down payment)',
      acompteReservationText: '30% down payment to secure your date. Priority and secure slot. Balance to be paid 72h before the event.',
      acceptTerms: 'I accept the terms and conditions',
      payAcompte: 'Pay down payment and secure date',
      sendRequest: 'Send my request',
      submitting: 'Submitting...',
      successTitle: 'Reservation confirmed!',
      successMessage: '✅ Thank you! Your down payment is confirmed. Your date is secured. You will receive a summary by email and we contact you within 24h.',
      infoSuccessTitle: 'Request sent!',
      infoSuccessMessage: 'Thank you! We will contact you back within 24h. ⚠️ Your date is not yet secured — pay a down payment to secure it.',
      orderNumber: 'Order number',
      total: 'Total',
      acompteAmount: 'Down payment (30%)',
      eventTypeOptions: ['Wedding', 'Worship', 'Association', 'Corporate', 'Birthday', 'Other'],
      specialRequestsPlaceholder: 'Specific needs, technical constraints...',
      required: 'Required',
      horsParisNote: 'Outside Paris: +80 € transport (adjusted after address)',
      calendarButton: 'View availability calendar',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Outside Paris',
      transportFee: '+80 € transport'
    }
  };

  const packs = {
    fr: [
      {
        id: 2,
        name: "Pack STANDARD",
        priceParis: "550 € TTC",
        priceHorsParis: "630 € TTC",
        pricingZones: {
          "Paris intra-muros": "550 € TTC",
          "Petite couronne (0–15 km)": "630 € TTC",
          "Moyenne couronne (15–30 km)": "710 € TTC",
          "Grande couronne (30–50 km)": "750 € TTC",
          "Au-delà de 50 km": "Sur devis"
        }
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        priceParis: "700 € TTC",
        priceHorsParis: "780 € TTC",
        pricingZones: {
          "Paris intra-muros": "700 € TTC",
          "Petite couronne (0–15 km)": "780 € TTC",
          "Moyenne couronne (15–30 km)": "860 € TTC",
          "Grande couronne (30–50 km)": "900 € TTC",
          "Au-delà de 50 km": "Sur devis"
        }
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        priceParis: "1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        pricingZones: {
          "Paris intra-muros": "1 100 € TTC",
          "Petite couronne (0–15 km)": "1 180 € TTC",
          "Moyenne couronne (15–30 km)": "1 260 € TTC",
          "Grande couronne (30–50 km)": "1 300 € TTC",
          "Au-delà de 50 km": "Sur devis"
        }
      }
    ],
    en: [
      {
        id: 2,
        name: "Pack STANDARD",
        priceParis: "550 € TTC",
        priceHorsParis: "630 € TTC",
        pricingZones: {
          "Paris intra-muros": "550 € TTC",
          "Inner suburbs (0–15 km)": "630 € TTC",
          "Outer suburbs (15–30 km)": "710 € TTC",
          "Greater Paris (30–50 km)": "750 € TTC",
          "Beyond 50 km": "Quote on request"
        }
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        priceParis: "700 € TTC",
        priceHorsParis: "780 € TTC",
        pricingZones: {
          "Paris intra-muros": "700 € TTC",
          "Inner suburbs (0–15 km)": "780 € TTC",
          "Outer suburbs (15–30 km)": "860 € TTC",
          "Greater Paris (30–50 km)": "900 € TTC",
          "Beyond 50 km": "Quote on request"
        }
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        priceParis: "1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        pricingZones: {
          "Paris intra-muros": "1 100 € TTC",
          "Inner suburbs (0–15 km)": "1 180 € TTC",
          "Outer suburbs (15–30 km)": "1 260 € TTC",
          "Greater Paris (30–50 km)": "1 300 € TTC",
          "Beyond 50 km": "Quote on request"
        }
      }
    ]
  };

  const selectedPack = packs[language].find(pack => pack.id === packId);
  const basePrice = parseInt(selectedPack?.priceParis.replace(/[^\d]/g, '') || '0');
  const acompteAmount = Math.round(basePrice * 0.3);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isSubmitted) {
    const isAcompteReservation = formData.reservationType === 'acompte';
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <h1 className="text-4xl font-bold text-black mb-6">
            {isAcompteReservation ? texts[language].successTitle : texts[language].infoSuccessTitle}
          </h1>
          <p className="text-xl text-gray-600 mb-8 whitespace-pre-line">
            {isAcompteReservation ? texts[language].successMessage : texts[language].infoSuccessMessage}
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">{texts[language].orderNumber}:</span>
              <span className="font-bold text-black">#SND{Math.floor(Math.random() * 10000)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">{selectedPack?.name}:</span>
              <span className="font-bold text-black">{selectedPack?.priceParis}</span>
            </div>
            {isAcompteReservation && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{texts[language].acompteAmount}:</span>
                <span className="font-bold text-[#F2431E]">{acompteAmount}€</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">{texts[language].total}:</span>
                <span className="text-2xl font-bold text-[#F2431E]">
                  {isAcompteReservation ? `${basePrice}€` : 'Gratuit'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+33651084994"
              className="bg-[#F2431E] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
            >
              <i className="ri-phone-line mr-2"></i>
              Nous appeler
            </a>
            <Link href="/">
              <button className="border-2 border-black text-black px-8 py-4 rounded-xl font-semibold hover:bg-black hover:text-white transition-colors">
                Retour à l'accueil
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/packs">
            <button className="flex items-center text-gray-600 hover:text-black transition-colors mb-6">
              <i className="ri-arrow-left-line mr-2"></i>
              {texts[language].backToSelection}
            </button>
          </Link>

          <h1 className="text-4xl font-bold text-black mb-6">
            {texts[language].title}
          </h1>

          {/* Sous-titre réassurance */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <p className="text-green-800 font-medium whitespace-pre-line">
              {texts[language].subtitle}
            </p>
          </div>

          {/* Pack sélectionné */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-black mb-4">
              {texts[language].selectedPack}
            </h3>
            {selectedPack ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{selectedPack.name}</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-black">{selectedPack.priceParis}</div>
                    <div className="text-sm text-gray-600">{texts[language].parisPrice}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-500">
                Pack non trouvé (ID: {packId})
              </div>
            )}
          </div>

          {/* Calendrier de disponibilité */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <i className="ri-calendar-line mr-2"></i>
              {texts[language].calendarButton}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} id="reservation-form" className="space-y-12">
          {/* Type de réservation */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
              {texts[language].reservationType}
            </h3>
            <div className="space-y-4">
              {/* Option 1 - Demande d'information */}
              <label className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${
                formData.reservationType === 'info' 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    name="reservationType"
                    value="info"
                    checked={formData.reservationType === 'info'}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-[#F2431E] border-gray-300 focus:ring-[#F2431E]"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-lg text-gray-700">
                        {texts[language].infoRequest}
                      </span>
                      <span className="text-lg font-bold text-green-600">Gratuit</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {texts[language].infoRequestText}
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 2 - Réservation avec acompte */}
              <label className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${
                formData.reservationType === 'acompte' 
                  ? 'border-[#F2431E] bg-[#F2431E]/5' 
                  : 'border-gray-200 hover:border-[#F2431E]/50'
              }`}>
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    name="reservationType"
                    value="acompte"
                    checked={formData.reservationType === 'acompte'}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-[#F2431E] border-gray-300 focus:ring-[#F2431E]"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-lg text-gray-700">
                        {texts[language].acompteReservation}
                      </span>
                      <span className="text-lg font-bold text-[#F2431E]">{acompteAmount}€</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {texts[language].acompteReservationText}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].email} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                />
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
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
              {texts[language].eventDetails}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].eventType} <span className="text-red-500">*</span>
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                >
                  <option value="">Sélectionnez un type d'événement</option>
                  {texts[language].eventTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
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
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts[language].eventAddress} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventAddress"
                    value={formData.eventAddress}
                    onChange={handleChange}
                    placeholder="Adresse complète"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts[language].eventCity} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventCity"
                    value={formData.eventCity}
                    onChange={handleChange}
                    placeholder="Ville"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts[language].eventPostalCode} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventPostalCode"
                    value={formData.eventPostalCode}
                    onChange={handleChange}
                    placeholder="Code postal"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] resize-none text-lg"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.specialRequests.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Accept Terms */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                required
                className="w-5 h-5 text-[#F2431E] border-gray-300 rounded focus:ring-[#F2431E]"
              />
              <span className="text-lg text-gray-700">
                {texts[language].acceptTerms} <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.acceptTerms}
            className="w-full bg-[#F2431E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? texts[language].submitting : (
              formData.reservationType === 'acompte' 
                ? texts[language].payAcompte 
                : texts[language].sendRequest
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
