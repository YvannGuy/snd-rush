'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  packKey: 'conference' | 'soiree' | 'mariage';
  language?: 'fr' | 'en';
}

interface WizardData {
  eventType: string;
  peopleCount: number | null;
  ambiance: string;
  indoorOutdoor: string;
}

export default function BookingWizard({ isOpen, onClose, packKey, language = 'fr' }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    eventType: '',
    peopleCount: null,
    ambiance: '',
    indoorOutdoor: '',
  });

  const texts = {
    fr: {
      title: 'L\'assistant vous guide',
      step1: {
        title: 'Type d\'événement',
        question: 'Quel type d\'événement organisez-vous ?',
        options: {
          conference: 'Conférence / Réunion',
          soiree: 'Soirée / Anniversaire',
          mariage: 'Mariage / Cérémonie',
          autre: 'Autre événement',
        },
      },
      step2: {
        title: 'Nombre de personnes',
        question: 'Combien de personnes environ ?',
        placeholder: 'Ex: 50',
      },
      step3: {
        title: 'Ambiance sonore',
        question: 'Quel type d\'ambiance souhaitez-vous ?',
        options: {
          doux: 'Musique d\'ambiance douce',
          fort: 'Son fort pour danser',
          discours: 'Discours et prises de parole',
          mixte: 'Mixte (discours + musique)',
        },
      },
      step4: {
        title: 'Lieu',
        question: 'Votre événement se déroule-t-il en intérieur ou extérieur ?',
        options: {
          interieur: 'Intérieur',
          exterieur: 'Extérieur',
        },
      },
      next: 'Suivant',
      previous: 'Précédent',
      finish: 'Voir ma solution',
      close: 'Fermer',
    },
    en: {
      title: 'Guided assistant',
      step1: {
        title: 'Event type',
        question: 'What type of event are you organizing?',
        options: {
          conference: 'Conference / Meeting',
          soiree: 'Party / Birthday',
          mariage: 'Wedding / Ceremony',
          autre: 'Other event',
        },
      },
      step2: {
        title: 'Number of people',
        question: 'How many people approximately?',
        placeholder: 'Ex: 50',
      },
      step3: {
        title: 'Sound ambiance',
        question: 'What type of ambiance do you want?',
        options: {
          doux: 'Soft background music',
          fort: 'Loud sound for dancing',
          discours: 'Speeches and presentations',
          mixte: 'Mixed (speeches + music)',
        },
      },
      step4: {
        title: 'Location',
        question: 'Will your event take place indoors or outdoors?',
        options: {
          interieur: 'Indoors',
          exterieur: 'Outdoors',
        },
      },
      next: 'Next',
      previous: 'Previous',
      finish: 'See my solution',
      close: 'Close',
    },
  };

  const currentTexts = texts[language];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Rediriger vers /book/[pack_key] avec les données pré-remplies
      const params = new URLSearchParams();
      if (data.peopleCount) params.set('people', data.peopleCount.toString());
      if (data.ambiance) params.set('ambiance', data.ambiance);
      if (data.indoorOutdoor) params.set('location', data.indoorOutdoor);
      
      router.push(`/book/${packKey}?${params.toString()}`);
      onClose();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.eventType !== '';
      case 2:
        return data.peopleCount !== null && data.peopleCount > 0;
      case 3:
        return data.ambiance !== '';
      case 4:
        return data.indoorOutdoor !== '';
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <CardTitle className="text-2xl">{currentTexts.title}</CardTitle>
          <div className="mt-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded ${
                    s <= step ? 'bg-[#F2431E]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Étape {step} sur 4
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Event Type */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentTexts.step1.title}</h3>
              <p className="text-gray-600 mb-6">{currentTexts.step1.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentTexts.step1.options).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setData({ ...data, eventType: key })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.eventType === key
                        ? 'border-[#F2431E] bg-[#F2431E]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: People Count */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentTexts.step2.title}</h3>
              <p className="text-gray-600 mb-6">{currentTexts.step2.question}</p>
              <input
                type="number"
                min="1"
                value={data.peopleCount || ''}
                onChange={(e) => setData({ ...data, peopleCount: parseInt(e.target.value) || null })}
                placeholder={currentTexts.step2.placeholder}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:border-[#F2431E]"
              />
            </div>
          )}

          {/* Step 3: Ambiance */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentTexts.step3.title}</h3>
              <p className="text-gray-600 mb-6">{currentTexts.step3.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentTexts.step3.options).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setData({ ...data, ambiance: key })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.ambiance === key
                        ? 'border-[#F2431E] bg-[#F2431E]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Indoor/Outdoor */}
          {step === 4 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentTexts.step4.title}</h3>
              <p className="text-gray-600 mb-6">{currentTexts.step4.question}</p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(currentTexts.step4.options).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setData({ ...data, indoorOutdoor: key })}
                    className={`p-6 rounded-lg border-2 transition-all text-lg ${
                      data.indoorOutdoor === key
                        ? 'border-[#F2431E] bg-[#F2431E]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              onClick={handlePrevious}
              disabled={step === 1}
              variant="outline"
            >
              {currentTexts.previous}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[#F2431E] text-white hover:bg-[#E63A1A]"
            >
              {step === 4 ? currentTexts.finish : currentTexts.next}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
