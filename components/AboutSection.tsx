
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
        step1Title: 'Choisissez votre pack',
        step1Description: 'Sélectionnez le pack qui correspond à votre événement',
        step2Title: 'Planifiez votre événement',
        step2Description: 'Remplissez les détails et choisissez votre date',
        step3Title: 'Payez et confirmez',
        step3Description: 'Paiement sécurisé et confirmation par email'
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

        {/* Section Paiements Sécurisés */}
        <div className="mt-16 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-12">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-shield-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-black mb-4">
                {language === 'fr' ? 'Paiements 100% Sécurisés' : '100% Secure Payments'}
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {language === 'fr' 
                  ? 'Tous nos paiements sont protégés par Stripe, leader mondial du paiement en ligne. Vos données bancaires sont chiffrées et sécurisées.'
                  : 'All our payments are protected by Stripe, the world leader in online payments. Your banking data is encrypted and secure.'
                }
              </p>
            </div>

            {/* Logos des cartes de paiement */}
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                  <path d="M20 8H28V24H20V8Z" fill="white"/>
                  <path d="M32 8H36V24H32V8Z" fill="white"/>
                  <path d="M12 8H16V24H12V8Z" fill="white"/>
                  <path d="M24 8H28V24H24V8Z" fill="white"/>
                </svg>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="32" rx="4" fill="#EB001B"/>
                  <path d="M24 16C24 12.6863 26.6863 10 30 10H42C45.3137 10 48 12.6863 48 16C48 19.3137 45.3137 22 42 22H30C26.6863 22 24 19.3137 24 16Z" fill="#F79E1B"/>
                  <path d="M0 16C0 12.6863 2.68629 10 6 10H18C21.3137 10 24 12.6863 24 16C24 19.3137 21.3137 22 18 22H6C2.68629 22 0 19.3137 0 16Z" fill="#FF5F00"/>
                </svg>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <i className="ri-lock-line text-green-600"></i>
                <span>{language === 'fr' ? 'Chiffrement SSL' : 'SSL Encryption'}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <i className="ri-shield-check-line text-green-600"></i>
                <span>{language === 'fr' ? 'Certification PCI DSS' : 'PCI DSS Certified'}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <i className="ri-bank-card-line text-green-600"></i>
                <span>{language === 'fr' ? 'Paiement en 3D Secure' : '3D Secure Payment'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
