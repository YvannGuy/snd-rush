
'use client';

import { useState } from 'react';

interface PersonalInfoStepProps {
  language: 'fr' | 'en';
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  selectedPack?: any;
}

export default function PersonalInfoStep({ language, onSubmit, onBack, initialData = {}, selectedPack }: PersonalInfoStepProps) {
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
    specialRequests: initialData.specialRequests || ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
      errorGuestCount: 'Nombre invalide'
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
      errorGuestCount: 'Invalid number'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation complète
    const newErrors: {[key: string]: string} = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'eventDate', 'eventTime', 'guestCount', 'eventType'];
    return requiredFields.every(field => formData[field as keyof typeof formData] && !errors[field]);
  };

  // Définir la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

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
            disabled={!isFormValid()}
            className="flex-1 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {texts[language].continue}
          </button>
        </div>
      </form>
    </div>
  );
}