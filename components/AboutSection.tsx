
'use client';

import { useState } from 'react';

interface AboutSectionProps {
  language: 'fr' | 'en';
}

export default function AboutSection({ language }: AboutSectionProps) {
  const [activeTab, setActiveTab] = useState<'advance' | 'express'>('advance');

  const texts = {
    fr: {
      title: 'Un processus rapide et sans friction pour votre tranquillité.',
      titleHighlight: 'rapide et sans friction',
      processTitle: 'Comment ça marche ?',
      processSubtitle: 'Selon le type de réservation',
      advanceTab: 'Réservation à l\'avance',
      expressTab: 'Intervention express',
      advanceSteps: {
        step1Title: 'Assistant IA personnalisé',
        step1Description: 'Notre assistant IA analyse vos besoins et vous guide vers le pack idéal en quelques questions simples',
        step2Title: 'Formulaire de réservation',
        step2Description: 'Remplissez vos informations personnelles et choisissez votre date via notre interface intuitive',
        step3Title: 'Paiement flexible',
        step3Description: 'Payez un acompte pour confirmer votre réservation ou réglez l\'intégralité - confirmation immédiate'
      },
      expressSteps: {
        step1Title: 'Appelez-nous directement',
        step1Description: 'Contactez-nous pour une intervention d\'urgence',
        step2Title: 'Décrivez votre besoin',
        step2Description: 'Expliquez rapidement votre situation',
        step3Title: 'Intervention rapide',
        step3Description: 'Installation dans les plus brefs délais'
      }
    },
    en: {
      title: 'A quick and frictionless process for your peace of mind.',
      titleHighlight: 'quick and frictionless',
      processTitle: 'How it works?',
      processSubtitle: 'According to the type of reservation',
      advanceTab: 'Advance booking',
      expressTab: 'Express intervention',
      advanceSteps: {
        step1Title: 'Choose your pack',
        step1Description: 'Select the pack that matches your event',
        step2Title: 'Plan your event',
        step2Description: 'Fill in the details and choose your date',
        step3Title: 'Pay and confirm',
        step3Description: 'Secure payment and email confirmation'
      },
      expressSteps: {
        step1Title: 'Call us directly',
        step1Description: 'Contact us for emergency intervention',
        step2Title: 'Describe your need',
        step2Description: 'Quickly explain your situation',
        step3Title: 'Quick intervention',
        step3Description: 'Installation as soon as possible'
      }
    }
  };

  const currentSteps = activeTab === 'advance' ? texts[language].advanceSteps : texts[language].expressSteps;

  return (
    <section className="py-24 lg:py-32 bg-white transition-all duration-1000 ease-in-out mx-4 mb-8 rounded-3xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-20 transform transition-all duration-1000 ease-in-out">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight transition-all duration-1000 ease-in-out">
            {language === 'fr' ? (
              <>
                Un processus{' '}
                <span className="text-[#F2431E]">rapide et sans friction</span>{' '}
                pour votre tranquillité.
              </>
            ) : (
              <>
                A{' '}
                <span className="text-[#F2431E]">quick and frictionless</span>{' '}
                process for your peace of mind.
              </>
            )}
          </h2>
        </div>

        {/* Process Illustration */}
        <div className="bg-gray-50 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4">
              {texts[language].processTitle}
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              {texts[language].processSubtitle}
            </p>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-full p-2 shadow-lg">
                <button
                  onClick={() => setActiveTab('advance')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === 'advance'
                      ? 'bg-[#F2431E] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {texts[language].advanceTab}
                </button>
                <button
                  onClick={() => setActiveTab('express')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === 'express'
                      ? 'bg-[#F2431E] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {texts[language].expressTab}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-[#F2431E] rounded-full flex items-center justify-center mb-6">
                  <i className={`text-white text-3xl ${activeTab === 'advance' ? 'ri-box-3-line' : 'ri-phone-line'}`}></i>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h4 className="text-xl font-semibold text-black mb-4">
                {currentSteps.step1Title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {currentSteps.step1Description}
              </p>
              {/* Arrow */}
              <div className="hidden md:block absolute top-10 -right-6 text-gray-400">
                <i className="ri-arrow-right-line text-2xl"></i>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-[#F2431E] rounded-full flex items-center justify-center mb-6">
                  <i className={`text-white text-3xl ${activeTab === 'advance' ? 'ri-calendar-line' : 'ri-chat-3-line'}`}></i>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h4 className="text-xl font-semibold text-black mb-4">
                {currentSteps.step2Title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {currentSteps.step2Description}
              </p>
              {/* Arrow */}
              <div className="hidden md:block absolute top-10 -right-6 text-gray-400">
                <i className="ri-arrow-right-line text-2xl"></i>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-[#F2431E] rounded-full flex items-center justify-center mb-6">
                  <i className={`text-white text-3xl ${activeTab === 'advance' ? 'ri-secure-payment-line' : 'ri-truck-line'}`}></i>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h4 className="text-xl font-semibold text-black mb-4">
                {currentSteps.step3Title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {currentSteps.step3Description}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
