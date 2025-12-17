'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RequestProAccessProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  onSuccess?: () => void;
}

export default function RequestProAccess({
  isOpen,
  onClose,
  language,
  onSuccess,
}: RequestProAccessProps) {
  const { user } = useUser();
  const [proType, setProType] = useState('');
  const [proUsage, setProUsage] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const texts = {
    fr: {
      title: 'Demander l\'accès Pro',
      description: 'Remplissez ce formulaire pour demander votre accès à l\'espace professionnel.',
      proType: 'Type de professionnel',
      proTypePlaceholder: 'Sélectionnez votre type',
      proTypeOptions: {
        dj: 'DJ',
        tech: 'Technicien son/lumière',
        orga: 'Organisateur d\'événements',
        autre: 'Autre',
      },
      proUsage: 'Usage prévu',
      proUsagePlaceholder: 'Décrivez comment vous utiliserez le matériel...',
      phone: 'Téléphone',
      phonePlaceholder: '+33 6 12 34 56 78',
      submit: 'Envoyer la demande',
      cancel: 'Annuler',
      success: 'Demande envoyée',
      successMessage: 'Votre demande d\'accès Pro a été envoyée. Vous serez notifié dès que votre compte sera activé.',
      error: 'Erreur',
      required: 'Ce champ est requis',
    },
    en: {
      title: 'Request Pro Access',
      description: 'Fill out this form to request access to the professional space.',
      proType: 'Professional type',
      proTypePlaceholder: 'Select your type',
      proTypeOptions: {
        dj: 'DJ',
        tech: 'Sound/Light technician',
        orga: 'Event organizer',
        autre: 'Other',
      },
      proUsage: 'Intended usage',
      proUsagePlaceholder: 'Describe how you will use the equipment...',
      phone: 'Phone',
      phonePlaceholder: '+33 6 12 34 56 78',
      submit: 'Send request',
      cancel: 'Cancel',
      success: 'Request sent',
      successMessage: 'Your Pro access request has been sent. You will be notified as soon as your account is activated.',
      error: 'Error',
      required: 'This field is required',
    },
  };

  const currentTexts = texts[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!proType || !proUsage) {
      setError(currentTexts.required);
      return;
    }

    if (!user?.id || !supabase) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);

    try {
      // Upsert dans user_profiles
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          pro_status: 'pending',
          pro_type: proType,
          pro_usage: proUsage,
          phone: phone || null,
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('Erreur demande accès pro:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {currentTexts.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {currentTexts.success}
                </h3>
                <p className="text-gray-600">
                  {currentTexts.successMessage}
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  {currentTexts.description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Pro Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentTexts.proType} *
                    </label>
                    <select
                      value={proType}
                      onChange={(e) => setProType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                      required
                    >
                      <option value="">{currentTexts.proTypePlaceholder}</option>
                      <option value="dj">{currentTexts.proTypeOptions.dj}</option>
                      <option value="tech">{currentTexts.proTypeOptions.tech}</option>
                      <option value="orga">{currentTexts.proTypeOptions.orga}</option>
                      <option value="autre">{currentTexts.proTypeOptions.autre}</option>
                    </select>
                  </div>

                  {/* Pro Usage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentTexts.proUsage} *
                    </label>
                    <textarea
                      value={proUsage}
                      onChange={(e) => setProUsage(e.target.value)}
                      placeholder={currentTexts.proUsagePlaceholder}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentTexts.phone}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={currentTexts.phonePlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      {currentTexts.cancel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#F2431E] text-white hover:bg-[#E63A1A]"
                    >
                      {loading ? '...' : currentTexts.submit}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
