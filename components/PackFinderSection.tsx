'use client';

import { useState } from 'react';

interface PackFinderSectionProps {
  language: 'fr' | 'en';
}

export default function PackFinderSection({ language }: PackFinderSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const texts = {
    fr: {
      title: 'Trouvez votre pack idéal',
      titleHighlight: 'en quelques clics',
      subtitle: 'Répondez à 2 questions simples et découvrez le pack parfait pour votre événement.',
      question1: 'Quel type d\'événement organisez-vous ?',
      question2: 'Combien de personnes attendues ?',
      findMyPack: 'Trouver mon pack',
      events: [
        { id: 'mariage', label: 'Mariage', icon: '💒' },
        { id: 'anniversaire', label: 'Anniversaire', icon: '🎂' },
        { id: 'conference', label: 'Conférence/Séminaire', icon: '🎤' },
        { id: 'concert', label: 'Concert/Spectacle', icon: '🎵' },
        { id: 'soiree', label: 'Soirée privée', icon: '🎉' },
        { id: 'entreprise', label: 'Événement d\'entreprise', icon: '🏢' }
      ],
      sizes: [
        { id: 'small', label: 'Moins de 50 personnes', range: '1-50' },
        { id: 'medium', label: '50 à 150 personnes', range: '50-150' },
        { id: 'large', label: '150 à 300 personnes', range: '150-300' },
        { id: 'xlarge', label: 'Plus de 300 personnes', range: '300+' }
      ]
    },
    en: {
      title: 'Find your ideal pack',
      titleHighlight: 'in a few clicks',
      subtitle: 'Answer 2 simple questions and discover the perfect pack for your event.',
      question1: 'What type of event are you organizing?',
      question2: 'How many people are expected?',
      findMyPack: 'Find my pack',
      events: [
        { id: 'mariage', label: 'Wedding', icon: '💒' },
        { id: 'anniversaire', label: 'Birthday', icon: '🎂' },
        { id: 'conference', label: 'Conference/Seminar', icon: '🎤' },
        { id: 'concert', label: 'Concert/Show', icon: '🎵' },
        { id: 'soiree', label: 'Private party', icon: '🎉' },
        { id: 'entreprise', label: 'Corporate event', icon: '🏢' }
      ],
      sizes: [
        { id: 'small', label: 'Less than 50 people', range: '1-50' },
        { id: 'medium', label: '50 to 150 people', range: '50-150' },
        { id: 'large', label: '150 to 300 people', range: '150-300' },
        { id: 'xlarge', label: 'More than 300 people', range: '300+' }
      ]
    }
  };

  const currentTexts = texts[language];

  const handleFindPack = () => {
    // Ouvrir l'assistant SoundRush Paris
    window.dispatchEvent(new CustomEvent('openAssistantModal'));
  };

  const isComplete = selectedEvent && selectedSize;

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-6">
            {currentTexts.title}
            <span className="text-[#F2431E]"> {currentTexts.titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
          {/* Question 1 */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-black mb-8 text-center">
              {currentTexts.question1}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentTexts.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    selectedEvent === event.id
                      ? 'border-[#F2431E] bg-[#F2431E]/5 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{event.icon}</div>
                  <div className="font-semibold text-gray-800 text-sm lg:text-base">
                    {event.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-black mb-8 text-center">
              {currentTexts.question2}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTexts.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    selectedSize === size.id
                      ? 'border-[#F2431E] bg-[#F2431E]/5 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 text-lg mb-1">
                        {size.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {size.range} personnes
                      </div>
                    </div>
                    <div className="text-2xl text-[#F2431E]">
                      👥
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bouton de résultat */}
          <div className="text-center">
            <button
              onClick={handleFindPack}
              disabled={!isComplete}
              className={`px-12 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                isComplete
                  ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A] shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <i className="ri-search-line mr-2 text-xl"></i>
              {currentTexts.findMyPack}
            </button>
            
            {!isComplete && (
              <p className="text-sm text-gray-500 mt-4">
                {language === 'fr' 
                  ? 'Répondez aux deux questions pour continuer' 
                  : 'Answer both questions to continue'
                }
              </p>
            )}
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className={`w-3 h-3 rounded-full ${selectedEvent ? 'bg-[#F2431E]' : 'bg-gray-300'}`}></div>
            <div className={`w-3 h-3 rounded-full ${selectedSize ? 'bg-[#F2431E]' : 'bg-gray-300'}`}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
