
'use client';

import { useState } from 'react';
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
    eventDuration: '',
    eventLocation: '',
    guestCount: '',
    specialRequests: '',
    urgentDelivery: false,
    acceptTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const texts = {
    fr: {
      title: 'Finaliser ma réservation',
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
      eventDuration: 'Durée estimée',
      eventLocation: 'Lieu de l\'événement',
      guestCount: 'Nombre d\'invités',
      specialRequests: 'Demandes spéciales',
      urgentDelivery: 'Livraison urgente (supplément +50€)',
      acceptTerms: 'J\'accepte les conditions générales',
      confirmReservation: 'Confirmer ma réservation',
      submitting: 'Envoi en cours...',
      successTitle: 'Réservation confirmée !',
      successMessage: 'Votre demande a été envoyée. Nous vous contacterons dans les 15 minutes pour confirmer les détails.',
      orderNumber: 'Numéro de commande',
      total: 'Total',
      eventTypePlaceholder: 'Mariage, anniversaire, conférence...',
      locationPlaceholder: 'Adresse complète du lieu',
      specialRequestsPlaceholder: 'Besoins spécifiques, contraintes techniques...',
      required: 'Obligatoire'
    },
    en: {
      title: 'Complete my reservation',
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
      eventDuration: 'Estimated duration',
      eventLocation: 'Event location',
      guestCount: 'Number of guests',
      specialRequests: 'Special requests',
      urgentDelivery: 'Urgent delivery (supplement +50€)',
      acceptTerms: 'I accept the terms and conditions',
      confirmReservation: 'Confirm my reservation',
      submitting: 'Submitting...',
      successTitle: 'Reservation confirmed!',
      successMessage: 'Your request has been sent. We will contact you within 15 minutes to confirm the details.',
      orderNumber: 'Order number',
      total: 'Total',
      eventTypePlaceholder: 'Wedding, birthday, conference...',
      locationPlaceholder: 'Complete address of the venue',
      specialRequestsPlaceholder: 'Specific needs, technical constraints...',
      required: 'Required'
    }
  };

  const packs = {
    fr: [
      {
        id: 1,
        name: "Mariage Express",
        price: "190€",
        duration: "12h"
      },
      {
        id: 2,
        name: "Événement Pro",
        price: "280€",
        duration: "8h"
      },
      {
        id: 3,
        name: "Soirée Privée",
        price: "120€",
        duration: "6h"
      }
    ],
    en: [
      {
        id: 1,
        name: "Wedding Express",
        price: "190€",
        duration: "12h"
      },
      {
        id: 2,
        name: "Corporate Event",
        price: "280€",
        duration: "8h"
      },
      {
        id: 3,
        name: "Private Party",
        price: "120€",
        duration: "6h"
      }
    ]
  };

  const selectedPack = packs[language].find(pack => pack.id === packId);
  const basePrice = parseInt(selectedPack?.price.replace(/[^\d]/g, '') || '0');
  const urgentFee = formData.urgentDelivery ? 50 : 0;
  const totalPrice = basePrice + urgentFee;

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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <h1 className="text-4xl font-bold text-black mb-6">
            {texts[language].successTitle}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {texts[language].successMessage}
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">{texts[language].orderNumber}:</span>
              <span className="font-bold text-black">#SND{Math.floor(Math.random() * 10000)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">{selectedPack?.name}:</span>
              <span className="font-bold text-black">{selectedPack?.price}</span>
            </div>
            {urgentFee > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Livraison urgente:</span>
                <span className="font-bold text-black">+{urgentFee}€</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">{texts[language].total}:</span>
                <span className="text-2xl font-bold text-[#F2431E]">{totalPrice}€</span>
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

          {/* Selected Pack Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-black mb-2">
              {texts[language].selectedPack}
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{selectedPack?.name}</span>
              <div className="text-right">
                <div className="text-xl font-bold text-black">{selectedPack?.price}</div>
                <div className="text-sm text-gray-500">{selectedPack?.duration}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} id="reservation-form" className="space-y-12">
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
                <input
                  type="text"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  placeholder={texts[language].eventTypePlaceholder}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                />
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
                    {texts[language].eventDuration} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventDuration"
                    value={formData.eventDuration}
                    onChange={handleChange}
                    placeholder="4h, 6h, 8h..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts[language].eventLocation} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="eventLocation"
                  value={formData.eventLocation}
                  onChange={handleChange}
                  placeholder={texts[language].locationPlaceholder}
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

          {/* Options */}
          <div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="urgentDelivery"
                  checked={formData.urgentDelivery}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#F2431E] border-gray-300 rounded focus:ring-[#F2431E]"
                />
                <span className="text-lg text-gray-700">
                  {texts[language].urgentDelivery}
                </span>
              </label>

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
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">{selectedPack?.name}:</span>
              <span className="font-bold text-black">{selectedPack?.price}</span>
            </div>
            {urgentFee > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Livraison urgente:</span>
                <span className="font-bold text-black">+{urgentFee}€</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-black">{texts[language].total}:</span>
                <span className="text-2xl font-bold text-[#F2431E]">{totalPrice}€</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.acceptTerms}
            className="w-full bg-[#F2431E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? texts[language].submitting : texts[language].confirmReservation}
          </button>
        </form>
      </div>
    </div>
  );
}
