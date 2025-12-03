'use client';

import { useState, useEffect } from 'react';

interface QuoteWizardProps {
  language: 'fr' | 'en';
}

export default function QuoteWizard({ language }: QuoteWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    eventType: '',
    date: '',
    time: '',
    location: '',
    numberOfPeople: '',
    venueType: '',
    urgency: '',
    packPreference: '',
    additionalEquipment: [] as string[],
    specialRequirements: '',
    contactInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });

  const texts = {
    fr: {
      hero: {
        title: 'Demandez votre devis personnalisé',
        subtitle: 'Réponse rapide — en moins de 30 min (IDF)',
        features: {
          equipment: 'Matériel pro & fiable',
          delivery: 'Livraison et installation',
          support: 'Support technique disponible'
        }
      },
      steps: {
        step1: 'Parlez-nous de votre événement',
        step2: 'Choisissez votre pack',
        step3: 'Équipements supplémentaires',
        step4: 'Vos coordonnées'
      },
      form: {
        eventType: 'Type d\'événement*',
        date: 'Date*',
        time: 'Horaire*',
        location: 'Lieu*',
        addressPlaceholder: 'Adresse de l\'événement:',
        numberOfPeople: 'Nombre de personnes*',
        venueType: 'Type de lieu*',
        indoor: 'Intérieur',
        outdoor: 'Extérieur',
        urgency: 'Urgence ?',
        yes24h: 'Oui (24h)',
        no: 'Non',
        packPreference: 'Pack préféré',
        additionalEquipment: 'Équipements supplémentaires',
        specialRequirements: 'Besoins spécifiques',
        requirementsPlaceholder: 'Décrivez vos besoins spécifiques...',
        firstName: 'Prénom*',
        lastName: 'Nom*',
        email: 'Email*',
        phone: 'Téléphone*',
        continue: 'Continuer →',
        back: '← Retour',
        submit: 'Envoyer la demande'
      },
      help: {
        title: 'Vous n\'êtes pas sûr de ce qu\'il vous faut ?',
        description: 'Pas de problème, nous vous aiderons à choisir le meilleur matériel pour votre événement.',
        talkToExpert: 'Parler à un expert'
      },
      why: {
        title: 'Pourquoi SoundRush ?',
        benefits: {
          equipment: {
            title: 'Matériel professionnel',
            description: 'Équipements haut de gamme testés et entretenus'
          },
          delivery: {
            title: 'Livraison partout en IDF',
            description: 'Intervention rapide sur toute l\'Île-de-France'
          },
          installation: {
            title: 'Installation & techniciens',
            description: 'Équipe technique disponible pour votre événement'
          },
          quote: {
            title: 'Devis sur mesure',
            description: 'Solutions adaptées à votre budget'
          },
          support: {
            title: 'Support 7j/7',
            description: 'Assistance technique disponible tous les jours'
          }
        },
        urgency: {
          title: 'Besoin urgent ?',
          description: 'Matériel livré en 2 heures en Île-de-France',
          callNow: 'Appeler maintenant'
        }
      }
    },
    en: {
      hero: {
        title: 'Request your personalized quote',
        subtitle: 'Fast response — in less than 30 min (IDF)',
        features: {
          equipment: 'Pro & reliable equipment',
          delivery: 'Delivery and installation',
          support: 'Technical support available'
        }
      },
      steps: {
        step1: 'Tell us about your event',
        step2: 'Choose your pack',
        step3: 'Additional equipment',
        step4: 'Your contact details'
      },
      form: {
        eventType: 'Event type*',
        date: 'Date*',
        time: 'Time*',
        location: 'Location*',
        addressPlaceholder: 'Event address:',
        numberOfPeople: 'Number of people*',
        venueType: 'Venue type*',
        indoor: 'Indoor',
        outdoor: 'Outdoor',
        urgency: 'Urgency?',
        yes24h: 'Yes (24h)',
        no: 'No',
        packPreference: 'Preferred pack',
        additionalEquipment: 'Additional equipment',
        specialRequirements: 'Special requirements',
        requirementsPlaceholder: 'Describe your specific needs...',
        firstName: 'First name*',
        lastName: 'Last name*',
        email: 'Email*',
        phone: 'Phone*',
        continue: 'Continue →',
        back: '← Back',
        submit: 'Send request'
      },
      help: {
        title: 'Not sure what you need?',
        description: 'No problem, we will help you choose the best equipment for your event.',
        talkToExpert: 'Talk to an expert'
      },
      why: {
        title: 'Why SoundRush?',
        benefits: {
          equipment: {
            title: 'Professional equipment',
            description: 'High-end equipment tested and maintained'
          },
          delivery: {
            title: 'Delivery everywhere in IDF',
            description: 'Fast intervention throughout Île-de-France'
          },
          installation: {
            title: 'Installation & technicians',
            description: 'Technical team available for your event'
          },
          quote: {
            title: 'Custom quote',
            description: 'Solutions adapted to your budget'
          },
          support: {
            title: 'Support 7/7',
            description: 'Technical assistance available every day'
          }
        },
        urgency: {
          title: 'Urgent need?',
          description: 'Equipment delivered in 2 hours in Île-de-France',
          callNow: 'Call now'
        }
      }
    }
  };

  const currentTexts = texts[language];

  const eventTypes = language === 'fr' 
    ? ['Mariage', 'Anniversaire', 'Conférence', 'Concert', 'Soirée privée', 'Événement corporate', 'Festival', 'Autre']
    : ['Wedding', 'Birthday', 'Conference', 'Concert', 'Private party', 'Corporate event', 'Festival', 'Other'];

  const peopleOptions = language === 'fr'
    ? ['Moins de 50', '50-100', '100-200', '200-300', '300-500', 'Plus de 500']
    : ['Less than 50', '50-100', '100-200', '200-300', '300-500', 'More than 500'];

  const packs = language === 'fr'
    ? ['Pack Mariage', 'Pack Conférence', 'Pack Concert', 'Pack Soirée', 'Je ne sais pas']
    : ['Wedding Pack', 'Conference Pack', 'Concert Pack', 'Party Pack', 'I don\'t know'];

  const additionalEquipmentOptions = language === 'fr'
    ? ['Micros supplémentaires', 'Lumières LED', 'Caissons de basse', 'Console DJ', 'Écran de projection', 'Scène']
    : ['Additional microphones', 'LED lights', 'Subwoofers', 'DJ console', 'Projection screen', 'Stage'];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEquipmentToggle = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      additionalEquipment: prev.additionalEquipment.includes(equipment)
        ? prev.additionalEquipment.filter(e => e !== equipment)
        : [...prev.additionalEquipment, equipment]
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/send-quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de la demande');
      }

      setSubmitSuccess(true);
      
      // Réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        setFormData({
          eventType: '',
          date: '',
          time: '',
          location: '',
          numberOfPeople: '',
          venueType: '',
          urgency: '',
          packPreference: '',
          additionalEquipment: [],
          specialRequirements: '',
          contactInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
          }
        });
        setCurrentStep(1);
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitError(
        language === 'fr' 
          ? 'Une erreur est survenue. Veuillez réessayer ou nous appeler au 06 51 08 49 94.'
          : 'An error occurred. Please try again or call us at 06 51 08 49 94.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.eventType && formData.date && formData.time && formData.location && 
               formData.numberOfPeople && formData.venueType && formData.urgency;
      case 2:
        return formData.packPreference;
      case 3:
        return true; // Optional step
      case 4:
        return formData.contactInfo.firstName && formData.contactInfo.lastName && 
               formData.contactInfo.email && formData.contactInfo.phone;
      default:
        return false;
    }
  };

  // Set default date to tomorrow
  useEffect(() => {
    if (!formData.date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDate = tomorrow.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, []);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <div className="relative bg-black text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: 'url(/concert.jpg)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {currentTexts.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12">
              {currentTexts.hero.subtitle}
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center text-2xl">
                  ✓
                </div>
                <span className="text-lg">{currentTexts.hero.features.equipment}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center text-2xl">
                  🚚
                </div>
                <span className="text-lg">{currentTexts.hero.features.delivery}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                  🎧
                </div>
                <span className="text-lg">{currentTexts.hero.features.support}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Étape {currentStep} sur 4
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {Math.round((currentStep / 4) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#F2431E] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-black mb-8">
                  {currentTexts.steps[`step${currentStep}` as keyof typeof currentTexts.steps]}
                </h2>

                {/* Step 1: Event Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.eventType}
                      </label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => handleInputChange('eventType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      >
                        <option value="">Sélectionnez...</option>
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentTexts.form.date}
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentTexts.form.time}
                        </label>
                        <input
                          type="time"
                          value={formData.time}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.location}
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder={currentTexts.form.addressPlaceholder}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.numberOfPeople}
                      </label>
                      <select
                        value={formData.numberOfPeople}
                        onChange={(e) => handleInputChange('numberOfPeople', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      >
                        <option value="">Sélectionnez...</option>
                        {peopleOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.venueType}
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleInputChange('venueType', 'indoor')}
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                            formData.venueType === 'indoor'
                              ? 'border-[#F2431E] bg-[#F2431E] text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <span>🏢</span>
                          {currentTexts.form.indoor}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('venueType', 'outdoor')}
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                            formData.venueType === 'outdoor'
                              ? 'border-[#F2431E] bg-[#F2431E] text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <span>🌳</span>
                          {currentTexts.form.outdoor}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.urgency}
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleInputChange('urgency', 'yes')}
                          className={`flex-1 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                            formData.urgency === 'yes'
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {currentTexts.form.yes24h}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('urgency', 'no')}
                          className={`flex-1 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                            formData.urgency === 'no'
                              ? 'border-gray-500 bg-gray-500 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {currentTexts.form.no}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Pack Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.packPreference}
                      </label>
                      <select
                        value={formData.packPreference}
                        onChange={(e) => handleInputChange('packPreference', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      >
                        <option value="">Sélectionnez...</option>
                        {packs.map(pack => (
                          <option key={pack} value={pack}>{pack}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.specialRequirements}
                      </label>
                      <textarea
                        value={formData.specialRequirements}
                        onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                        placeholder={currentTexts.form.requirementsPlaceholder}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Equipment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        {currentTexts.form.additionalEquipment}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {additionalEquipmentOptions.map(equipment => (
                          <button
                            key={equipment}
                            type="button"
                            onClick={() => handleEquipmentToggle(equipment)}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              formData.additionalEquipment.includes(equipment)
                                ? 'border-[#F2431E] bg-[#F2431E]/10'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{equipment}</span>
                              {formData.additionalEquipment.includes(equipment) && (
                                <span className="text-[#F2431E]">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Contact Info */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentTexts.form.firstName}
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.firstName}
                          onChange={(e) => handleInputChange('contactInfo.firstName', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentTexts.form.lastName}
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.lastName}
                          onChange={(e) => handleInputChange('contactInfo.lastName', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.email}
                      </label>
                      <input
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentTexts.form.phone}
                      </label>
                      <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      {currentTexts.form.back}
                    </button>
                  )}
                  <div className="ml-auto">
                    {currentStep < 4 ? (
                      <button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
                          isStepValid()
                            ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {currentTexts.form.continue}
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-3">
                        {submitSuccess && (
                          <div className="bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                            ✅ {language === 'fr' ? 'Demande envoyée avec succès ! Vous allez recevoir un email de confirmation.' : 'Request sent successfully! You will receive a confirmation email.'}
                          </div>
                        )}
                        {submitError && (
                          <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                            ❌ {submitError}
                          </div>
                        )}
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || !isStepValid()}
                          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
                            isSubmitting || !isStepValid()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                          }`}
                        >
                          {isSubmitting 
                            ? (language === 'fr' ? 'Envoi en cours...' : 'Sending...')
                            : currentTexts.form.submit
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Help Section */}
                {currentStep === 1 && (
                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">❓</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-2">
                          {currentTexts.help.title}
                        </h3>
                        <p className="text-gray-700 mb-4">
                          {currentTexts.help.description}
                        </p>
                        <a
                          href="tel:+33651084994"
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          <span>💬</span>
                          {currentTexts.help.talkToExpert}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Why SoundRush */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h3 className="text-2xl font-bold text-black mb-6">
                  {currentTexts.why.title}
                </h3>

                <div className="space-y-4 mb-8">
                  {Object.values(currentTexts.why.benefits).map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {index === 0 && '⭐'}
                        {index === 1 && '🚚'}
                        {index === 2 && '🔧'}
                        {index === 3 && '📄'}
                        {index === 4 && '🎧'}
                      </div>
                      <div>
                        <p className="font-semibold text-black mb-1">{benefit.title}</p>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Urgency Section */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
                  <h4 className="font-bold text-red-600 mb-2">
                    {currentTexts.why.urgency.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">
                    {currentTexts.why.urgency.description}
                  </p>
                  <a
                    href="tel:+33651084994"
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors w-full justify-center"
                  >
                    <span>📞</span>
                    {currentTexts.why.urgency.callNow}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

