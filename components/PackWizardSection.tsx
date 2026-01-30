'use client';

import { useState } from 'react';
import SectionChevron from './SectionChevron';
import { Users, Home, Music, Calendar, ArrowRight, CheckCircle2, Phone } from 'lucide-react';

interface PackWizardSectionProps {
  language: 'fr' | 'en';
}

type EventType = 'soiree' | 'conference' | 'mariage' | 'autre';
type LocationType = 'interieur' | 'exterieur';
type AmbianceType = 'douce' | 'dansante';

export default function PackWizardSection({ language }: PackWizardSectionProps) {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [customEventType, setCustomEventType] = useState('');
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [ambiance, setAmbiance] = useState<AmbianceType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ pack?: string; name: string; description: string; image: string; explanation: string } | null>(null);
  const [error, setError] = useState('');

  const texts = {
    fr: {
      title: 'Trouvez le pack qu\'il vous faut',
      subtitle: 'Répondez à quelques questions pour découvrir le pack adapté à votre événement',
      steps: {
        event: 'Quel type d\'événement ?',
        eventHelp: 'Le type d\'événement détermine le matériel nécessaire. Une conférence nécessite des micros et une sonorisation claire, tandis qu\'une soirée dansante demande plus de puissance et de basses.',
        people: 'Combien de personnes ?',
        peopleHelp: 'Le nombre de personnes est crucial pour dimensionner votre sonorisation. Plus il y a de monde, plus il faut de puissance sonore pour couvrir l\'ensemble de l\'espace et garantir une qualité audio optimale pour tous.',
        location: 'Intérieur ou extérieur ?',
        locationHelp: 'En extérieur, le son se disperse davantage dans l\'espace. Il faut donc environ 30% de puissance supplémentaire par rapport à un événement en intérieur pour compenser cette perte acoustique.',
        ambiance: 'Quel type d\'ambiance ?',
        ambianceHelp: 'Une ambiance douce (fond musical, discours) nécessite moins de puissance qu\'une ambiance dansante avec de la musique forte et des basses marquées. Le type d\'ambiance influence le choix des enceintes et des caissons de basses.',
        phone: 'Votre numéro de téléphone'
      },
      eventTypes: {
        soiree: 'Soirée',
        conference: 'Conférence',
        mariage: 'Mariage',
        autre: 'Autre'
      },
      locations: {
        interieur: 'Intérieur',
        exterieur: 'Extérieur'
      },
      ambiances: {
        douce: 'Musique douce',
        dansante: 'Musique dansante'
      },
      phonePlaceholder: '06 12 34 56 78',
      phoneLabel: 'Pour voir votre résultat, entrez votre numéro de téléphone',
      submit: 'Voir mon résultat',
      back: 'Retour',
      next: 'Suivant',
      packs: {
        S: {
          name: 'Pack S',
          description: 'Parfait pour les petits événements jusqu\'à 40 personnes',
          explanation: 'Le Pack S est dimensionné pour offrir une puissance sonore optimale jusqu\'à 40 personnes. Avec une enceinte active professionnelle d\'environ 500-800W RMS, vous bénéficiez d\'un son clair et puissant adapté aux espaces intérieurs moyens (50-100m²). Cette configuration garantit une couverture sonore homogène sans zones mortes, idéale pour les conférences, petits mariages ou soirées privées. Le matériel est compact et facile à installer, parfait pour les événements nécessitant une solution efficace sans encombrement.'
        },
        M: {
          name: 'Pack M',
          description: 'Idéal pour les événements moyens de 41 à 80 personnes',
          explanation: 'Le Pack M offre une puissance adaptée aux événements de 41 à 80 personnes. Avec une configuration d\'environ 1000-1500W RMS, ce pack assure une excellente couverture sonore pour des espaces jusqu\'à 150m² en intérieur. La puissance supplémentaire permet de gérer confortablement les ambiances dansantes avec des basses marquées, tout en conservant une qualité audio claire pour les prises de parole. Idéal pour les mariages moyens, soirées privées animées ou événements corporate nécessitant une sonorisation professionnelle et polyvalente.'
        },
        L: {
          name: 'Pack L',
          description: 'Conçu pour les grands événements de 81 à 150 personnes',
          explanation: 'Le Pack L est conçu pour les grands événements de 81 à 150 personnes. Avec une puissance de 2000-3000W RMS et un système complet incluant enceintes principales et caissons de basses, ce pack garantit une couverture sonore exceptionnelle pour des espaces jusqu\'à 250m². La configuration permet de gérer toutes les ambiances, des discours clairs aux soirées dansantes avec basses profondes. Le système est optimisé pour maintenir une qualité audio constante même à fort volume, sans distorsion, garantissant une expérience sonore professionnelle pour tous vos invités.'
        },
        XL: {
          name: 'Pack XL',
          description: 'Pour les très grands événements (151+ personnes) - Sur devis personnalisé',
          explanation: 'Pour les événements de plus de 150 personnes, le Pack XL nécessite une configuration sur mesure adaptée à votre espace et à vos besoins spécifiques. Nous dimensionnons un système professionnel avec plusieurs enceintes actives (3000W+ RMS), caissons de basses dédiés, et une configuration multi-zones si nécessaire. Cette solution garantit une couverture sonore parfaite pour de très grands espaces (300m²+), avec une puissance suffisante pour les événements en extérieur et les ambiances très dansantes. Notre équipe d\'experts analyse vos besoins pour proposer la configuration optimale.'
        }
      },
      resultTitle: 'Votre pack recommandé',
      resultSubtitle: '',
      contact: 'Nous contacter'
    },
    en: {
      title: 'Find the pack you need',
      subtitle: 'Answer a few questions to discover the pack adapted to your event',
      steps: {
        event: 'What type of event?',
        eventHelp: 'The type of event determines the necessary equipment. A conference requires microphones and clear sound, while a dance party needs more power and bass.',
        people: 'How many people?',
        peopleHelp: 'The number of people is crucial for sizing your sound system. The more people there are, the more sound power is needed to cover the entire space and ensure optimal audio quality for everyone.',
        location: 'Indoor or outdoor?',
        locationHelp: 'Outdoors, sound disperses more in space. You need approximately 30% more power compared to an indoor event to compensate for this acoustic loss.',
        ambiance: 'What type of atmosphere?',
        ambianceHelp: 'A soft atmosphere (background music, speeches) requires less power than a dancing atmosphere with loud music and marked bass. The type of atmosphere influences the choice of speakers and subwoofers.',
        phone: 'Your phone number'
      },
      eventTypes: {
        soiree: 'Party',
        conference: 'Conference',
        mariage: 'Wedding',
        autre: 'Other'
      },
      locations: {
        interieur: 'Indoor',
        exterieur: 'Outdoor'
      },
      ambiances: {
        douce: 'Soft music',
        dansante: 'Dancing music'
      },
      phonePlaceholder: '+33 6 12 34 56 78',
      phoneLabel: 'To see your result, enter your phone number',
      submit: 'See my result',
      back: 'Back',
      next: 'Next',
      packs: {
        S: {
          name: 'Pack S',
          description: 'Perfect for small events up to 40 people',
          explanation: 'Pack S is sized to provide optimal sound power for up to 40 people. With a professional active speaker of approximately 500-800W RMS, you benefit from clear and powerful sound adapted to medium indoor spaces (50-100m²). This configuration ensures homogeneous sound coverage without dead zones, ideal for conferences, small weddings or private parties. The equipment is compact and easy to install, perfect for events requiring an efficient solution without clutter.'
        },
        M: {
          name: 'Pack M',
          description: 'Ideal for medium events of 41 to 80 people',
          explanation: 'Pack M offers power adapted to events of 41 to 80 people. With a configuration of approximately 1000-1500W RMS, this pack ensures excellent sound coverage for spaces up to 150m² indoors. The additional power allows comfortable handling of dancing atmospheres with marked bass, while maintaining clear audio quality for speeches. Ideal for medium weddings, animated private parties or corporate events requiring professional and versatile sound.'
        },
        L: {
          name: 'Pack L',
          description: 'Designed for large events of 81 to 150 people',
          explanation: 'Pack L is designed for large events of 81 to 150 people. With a power of 2000-3000W RMS and a complete system including main speakers and subwoofers, this pack guarantees exceptional sound coverage for spaces up to 250m². The configuration allows handling all atmospheres, from clear speeches to dance parties with deep bass. The system is optimized to maintain constant audio quality even at high volume, without distortion, ensuring a professional sound experience for all your guests.'
        },
        XL: {
          name: 'Pack XL',
          description: 'For very large events (151+ people) - Custom quote',
          explanation: 'For events with more than 150 people, Pack XL requires a custom configuration adapted to your space and specific needs. We size a professional system with multiple active speakers (3000W+ RMS), dedicated subwoofers, and multi-zone configuration if necessary. This solution guarantees perfect sound coverage for very large spaces (300m²+), with sufficient power for outdoor events and very dancing atmospheres. Our team of experts analyzes your needs to propose the optimal configuration.'
        }
      },
      resultTitle: 'Your recommended pack',
      resultSubtitle: 'We sent you the details on Telegram',
      contact: 'Contact us'
    }
  };

  const currentTexts = texts[language];

  const calculatePack = (): { pack?: string; name: string; description: string; image: string; explanation: string } => {
    if (!peopleCount) {
      const pack = currentTexts.packs.S;
      return { pack: pack.name, name: pack.name, description: pack.description, image: '/packs.png', explanation: pack.explanation };
    }

    if (peopleCount >= 1 && peopleCount <= 40) {
      const pack = currentTexts.packs.S;
      return { pack: pack.name, name: pack.name, description: pack.description, image: '/packs.png', explanation: pack.explanation };
    } else if (peopleCount >= 41 && peopleCount <= 80) {
      const pack = currentTexts.packs.M;
      return { pack: pack.name, name: pack.name, description: pack.description, image: '/packM.png', explanation: pack.explanation };
    } else if (peopleCount >= 81 && peopleCount <= 150) {
      const pack = currentTexts.packs.L;
      return { pack: pack.name, name: pack.name, description: pack.description, image: '/packL.png', explanation: pack.explanation };
    } else {
      const pack = currentTexts.packs.XL;
      return { pack: pack.name, name: pack.name, description: pack.description, image: '/concert.jpg', explanation: pack.explanation };
    }
  };

  const handleNext = () => {
    if (step === 1 && !eventType) return;
    if (step === 1 && eventType === 'autre' && !customEventType.trim()) return;
    if (step === 2 && !peopleCount) return;
    if (step === 3 && !location) return;
    if (step === 4 && !ambiance) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const validatePhone = (phone: string): boolean => {
    // Validation basique pour numéro français
    const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;
    const cleaned = phone.replace(/\s/g, '');
    return phoneRegex.test(cleaned) || cleaned.length >= 10;
  };

  const handleSubmit = async () => {
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      setError(language === 'fr' ? 'Veuillez entrer un numéro de téléphone valide' : 'Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const packResult = calculatePack();
    
    try {
      const response = await fetch('/api/pack-wizard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: eventType === 'autre' ? customEventType : eventType,
          peopleCount,
          location,
          ambiance,
          phoneNumber,
          pack: packResult.pack,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      setResult(packResult);
      setStep(6); // Afficher le résultat
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors de l\'envoi. Veuillez réessayer.' : 'Error sending. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setEventType(null);
    setCustomEventType('');
    setPeopleCount(null);
    setLocation(null);
    setAmbiance(null);
    setPhoneNumber('');
    setResult(null);
    setError('');
  };

  return (
    <section id="pack-wizard" className="py-16 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {currentTexts.title}
          </h2>
          <p className="text-xl text-gray-600">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Wizard */}
        {step < 6 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      s < step
                        ? 'bg-[#F2431E] text-white'
                        : s === step
                        ? 'bg-[#F2431E] text-white ring-4 ring-[#F2431E]/20'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#F2431E] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((step - 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {/* Step 1: Event Type */}
              {step === 1 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {currentTexts.steps.event}
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    {currentTexts.steps.eventHelp}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {(['soiree', 'conference', 'mariage', 'autre'] as EventType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setEventType(type);
                          if (type !== 'autre') {
                            setCustomEventType('');
                          }
                        }}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          eventType === type
                            ? 'border-[#F2431E] bg-[#F2431E]/10'
                            : 'border-gray-200 hover:border-[#F2431E]/50'
                        }`}
                      >
                        <Calendar className="w-8 h-8 mx-auto mb-3 text-[#F2431E]" />
                        <p className="font-semibold text-gray-900">
                          {currentTexts.eventTypes[type]}
                        </p>
                      </button>
                    ))}
                  </div>
                  {eventType === 'autre' && (
                    <div className="max-w-md mx-auto">
                      <input
                        type="text"
                        value={customEventType}
                        onChange={(e) => setCustomEventType(e.target.value)}
                        placeholder={language === 'fr' ? 'Précisez le type d\'événement' : 'Specify the event type'}
                        className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: People Count */}
              {step === 2 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {currentTexts.steps.people}
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    {currentTexts.steps.peopleHelp}
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-4">
                      <Users className="w-8 h-8 text-[#F2431E]" />
                      <input
                        type="number"
                        min="1"
                        value={peopleCount || ''}
                        onChange={(e) => setPeopleCount(parseInt(e.target.value) || null)}
                        placeholder="Ex: 50"
                        className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {currentTexts.steps.location}
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    {currentTexts.steps.locationHelp}
                  </p>
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    {(['interieur', 'exterieur'] as LocationType[]).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`p-8 rounded-xl border-2 transition-all ${
                          location === loc
                            ? 'border-[#F2431E] bg-[#F2431E]/10'
                            : 'border-gray-200 hover:border-[#F2431E]/50'
                        }`}
                      >
                        <Home className="w-12 h-12 mx-auto mb-4 text-[#F2431E]" />
                        <p className="font-semibold text-gray-900 text-lg">
                          {currentTexts.locations[loc]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Ambiance */}
              {step === 4 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {currentTexts.steps.ambiance}
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    {currentTexts.steps.ambianceHelp}
                  </p>
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    {(['douce', 'dansante'] as AmbianceType[]).map((amb) => (
                      <button
                        key={amb}
                        onClick={() => setAmbiance(amb)}
                        className={`p-8 rounded-xl border-2 transition-all ${
                          ambiance === amb
                            ? 'border-[#F2431E] bg-[#F2431E]/10'
                            : 'border-gray-200 hover:border-[#F2431E]/50'
                        }`}
                      >
                        <Music className="w-12 h-12 mx-auto mb-4 text-[#F2431E]" />
                        <p className="font-semibold text-gray-900 text-lg">
                          {currentTexts.ambiances[amb]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Phone Number */}
              {step === 5 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {currentTexts.steps.phone}
                  </h3>
                  <p className="text-gray-600 mb-8 text-center">
                    {currentTexts.phoneLabel}
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                      <Phone className="w-6 h-6 text-[#F2431E]" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={currentTexts.phonePlaceholder}
                        className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-[#F2431E] focus:outline-none"
                      />
                    </div>
                    {error && (
                      <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  step === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {currentTexts.back}
              </button>
              {step < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && (!eventType || (eventType === 'autre' && !customEventType.trim()))) ||
                    (step === 2 && !peopleCount) ||
                    (step === 3 && !location) ||
                    (step === 4 && !ambiance)
                  }
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    (step === 1 && !eventType) ||
                    (step === 2 && !peopleCount) ||
                    (step === 3 && !location) ||
                    (step === 4 && !ambiance)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                  }`}
                >
                  {currentTexts.next}
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !phoneNumber}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    isSubmitting || !phoneNumber
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                  }`}
                >
                  {isSubmitting ? (
                    language === 'fr' ? 'Envoi...' : 'Sending...'
                  ) : (
                    <>
                      {currentTexts.submit}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-green-500" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {currentTexts.resultTitle}
              </h3>
              {result?.image && (
                <div className="mb-6 max-w-md mx-auto">
                  <img
                    src={result.image}
                    alt={result.name || result.pack || 'Pack'}
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              )}
              <p className="text-xl text-[#F2431E] font-bold mb-2">
                {result?.name || result?.pack}
              </p>
              <p className="text-gray-600 mb-6">
                {result?.description}
              </p>
            </div>
            
            {/* Detailed Explanation */}
            {result?.explanation && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 lg:p-8 mb-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {language === 'fr' ? 'Pourquoi ce pack ?' : 'Why this pack?'}
                </h4>
                <p className="text-gray-700 leading-relaxed text-base lg:text-lg text-left max-w-3xl mx-auto">
                  {result.explanation}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+33744782754"
                className="inline-flex items-center justify-center gap-2 bg-[#F2431E] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-all"
              >
                <Phone className="w-5 h-5" />
                {currentTexts.contact}
              </a>
              <button
                onClick={resetWizard}
                className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                {language === 'fr' ? 'Nouveau calcul' : 'New calculation'}
              </button>
            </div>
          </div>
        )}
      </div>
      <SectionChevron nextSectionId="solutions" />
    </section>
  );
}
