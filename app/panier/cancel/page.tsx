'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CartCancelPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const texts = {
    fr: {
      title: 'Paiement annulé',
      message: 'Votre paiement a été annulé. Votre panier a été conservé.',
      backToCart: 'Retour au panier',
      backHome: 'Retour à l\'accueil',
      help: 'Besoin d\'aide ?',
      contact: 'Contactez-nous',
    },
    en: {
      title: 'Payment cancelled',
      message: 'Your payment has been cancelled. Your cart has been saved.',
      backToCart: 'Back to cart',
      backHome: 'Back to home',
      help: 'Need help?',
      contact: 'Contact us',
    },
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[112px] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.title}</h1>
          <p className="text-xl text-gray-600 mb-8">{currentTexts.message}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/panier"
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.backToCart}
            </Link>
            <Link
              href="/"
              className="inline-block bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              {currentTexts.backHome}
            </Link>
          </div>
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">{currentTexts.help}</p>
            <a
              href="tel:+33744782754"
              className="text-[#F2431E] font-semibold hover:underline"
            >
              {currentTexts.contact}
            </a>
          </div>
        </div>
      </main>
      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}

