// Modal récapitulatif avec double parcours (info vs acompte)
'use client';

import React, { useState, useEffect } from 'react';
import { ReservationPayload, Recommendation } from '@/types/assistant';
import Input from './Input';
import ErrorText from './ErrorText';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation;
  answers: any;
  onConfirm: (payload: ReservationPayload) => void;
  isLoading?: boolean;
}

export default function ReservationModal({
  isOpen,
  onClose,
  recommendation,
  answers,
  onConfirm,
  isLoading = false
}: ReservationModalProps) {
  const [bookingType, setBookingType] = useState<'info' | 'deposit'>('info');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    postalCode: '',
    address: '',
    specialRequests: ''
  });
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setBookingType('info');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        date: answers.date || '', // Pre-remplir avec la date de l'assistant
        time: answers.time || '', // Pre-remplir avec l'heure de l'assistant
        postalCode: '',
        address: '',
        specialRequests: ''
      });
      setCgvAccepted(false);
      setErrors({});
    }
  }, [isOpen, answers.date, answers.time]); // Dépendre de date et time pour les mettre à jour

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est obligatoire';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est obligatoire';
    if (!formData.email.trim()) newErrors.email = 'L\'email est obligatoire';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est obligatoire';
    if (!formData.date.trim()) newErrors.date = 'La date est obligatoire';
    if (!formData.time.trim()) newErrors.time = 'L\'horaire est obligatoire';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Le code postal est obligatoire';
    
    if (!cgvAccepted) newErrors.cgv = 'Vous devez accepter les conditions générales';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    const payload: ReservationPayload = {
      bookingType,
      packName: recommendation.pack.name,
      packId: recommendation.pack.id,
      priceId: recommendation.pack.priceId,
      basePrice: recommendation.breakdown.base,
      deliveryPrice: recommendation.breakdown.delivery,
      extrasPrice: recommendation.breakdown.extras,
      urgencyPrice: recommendation.breakdown.urgency,
      totalPrice: recommendation.totalPrice,
      depositAmount: bookingType === 'deposit' ? Math.round(recommendation.totalPrice * 0.3) : undefined,
      answers,
      personalInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      eventDetails: {
        date: formData.date || answers.date || '',
        time: formData.time || answers.time || '',
        postalCode: formData.postalCode,
        address: formData.address,
        specialRequests: formData.specialRequests,
      },
      cgvAccepted,
    };

    onConfirm(payload);
  };

  const isFormValid = formData.firstName.trim() && 
                     formData.lastName.trim() && 
                     formData.email.trim() && 
                     /\S+@\S+\.\S+/.test(formData.email) &&
                     formData.phone.trim() && 
                     formData.date.trim() && 
                     formData.time.trim() && 
                     formData.postalCode.trim() && 
                     cgvAccepted;

  // Debug temporaire pour voir ce qui pose problème
  console.log('🔍 DEBUG MODAL RÉSERVATION:', {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    emailValid: /\S+@\S+\.\S+/.test(formData.email),
    phone: formData.phone.trim(),
    date: formData.date.trim(),
    time: formData.time.trim(),
    postalCode: formData.postalCode.trim(),
    cgvAccepted,
    isFormValid
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#e27431] to-[#e27431]/90 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Résumé de votre réservation</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <div className="space-y-6">
            {/* Pack et coûts */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{recommendation.pack.name}</h3>
              
              {/* Composition exacte */}
              {recommendation.compositionFinale && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Composition :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {recommendation.compositionFinale.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#e27431] mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pack de base :</span>
                  <span>{recommendation.breakdown.base} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison A/R :</span>
                  <span>{recommendation.breakdown.delivery} €</span>
                </div>
                {recommendation.breakdown.extras > 0 && (
                  <div className="flex justify-between">
                    <span>Options :</span>
                    <span>{recommendation.breakdown.extras} €</span>
                  </div>
                )}
                {recommendation.breakdown.urgency > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Majoration urgence :</span>
                    <span>{recommendation.breakdown.urgency} €</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total TTC :</span>
                  <span className="text-[#e27431]">{recommendation.totalPrice} €</span>
                </div>
                {bookingType === 'deposit' && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Acompte (30%) :</span>
                    <span>{Math.round(recommendation.totalPrice * 0.3)} €</span>
                  </div>
                )}
              </div>
            </div>

            {/* Type de réservation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Type de réservation</h3>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    value="info"
                    checked={bookingType === 'info'}
                    onChange={() => setBookingType('info')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Demande d'information (sans acompte)</div>
                    <div className="text-sm text-gray-600">
                      Vous laissez vos coordonnées, on vous rappelle sous 24 h. Le créneau n'est pas bloqué tant que l'acompte n'est pas versé.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    value="deposit"
                    checked={bookingType === 'deposit'}
                    onChange={() => setBookingType('deposit')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Réservation clé en main (acompte 30%)</div>
                    <div className="text-sm text-gray-600">
                      Acompte 30 % pour bloquer votre date. Créneau prioritaire et sécurisé. Solde à verser 72 h avant l'événement.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations personnelles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(val) => handleInputChange('firstName', val)}
                    error={errors.firstName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(val) => handleInputChange('lastName', val)}
                    error={errors.lastName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(val) => handleInputChange('email', val)}
                    error={errors.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(val) => handleInputChange('phone', val)}
                    error={errors.phone}
                  />
                </div>
              </div>
            </div>

            {/* Détails de l'événement */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Détails de l'événement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    value={formData.date || answers.date || ''}
                    onChange={(val) => handleInputChange('date', val)}
                    error={errors.date}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horaire *</label>
                  <Input
                    type="text"
                    value={formData.time}
                    onChange={(val) => handleInputChange('time', val)}
                    placeholder="Ex: 19h00"
                    error={errors.time}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                  <Input
                    type="text"
                    value={formData.postalCode}
                    onChange={(val) => handleInputChange('postalCode', val)}
                    placeholder="75001"
                    error={errors.postalCode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(val) => handleInputChange('address', val)}
                    placeholder="123 rue de la Paix"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Demandes spécifiques</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder="Besoins particuliers, contraintes techniques..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#e27431] focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* CGV */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cgvAccepted}
                  onChange={(e) => setCgvAccepted(e.target.checked)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <span>J'accepte les </span>
                  <a href="/cgv" target="_blank" className="text-[#e27431] hover:underline">
                    conditions générales
                  </a>
                  <span> *</span>
                </div>
              </label>
              {errors.cgv && <ErrorText message={errors.cgv} />}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid || isLoading}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              isFormValid && !isLoading
                ? 'bg-[#e27431] text-white hover:bg-[#e27431]/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isFormValid ? 'Veuillez remplir tous les champs obligatoires' : ''}
          >
            {isLoading ? 'Traitement...' : isFormValid ? 'Confirmer' : `Champs manquants (${!formData.firstName.trim() ? 'Prénom ' : ''}${!formData.lastName.trim() ? 'Nom ' : ''}${!formData.email.trim() ? 'Email ' : ''}${!/\S+@\S+\.\S+/.test(formData.email) ? 'Email invalide ' : ''}${!formData.phone.trim() ? 'Téléphone ' : ''}${!formData.date.trim() ? 'Date ' : ''}${!formData.time.trim() ? 'Horaire ' : ''}${!formData.postalCode.trim() ? 'Code postal ' : ''}${!cgvAccepted ? 'CGV ' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
}
