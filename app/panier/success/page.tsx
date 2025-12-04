'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function CartSuccessPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Vider le panier après un paiement réussi
    // Note: Le webhook Stripe devrait également créer la commande côté serveur
    if (sessionId) {
      clearCart();
      
      // Optionnel: Vérifier le statut de la session avec Stripe
      // fetch(`/api/verify-session?session_id=${sessionId}`)
      //   .then(res => res.json())
      //   .then(data => {
      //     if (data.verified) {
      //       console.log('✅ Paiement vérifié côté serveur');
      //     }
      //   });
    }
  }, [sessionId, clearCart]);

  const texts = {
    fr: {
      title: 'Paiement réussi !',
      message: 'Votre commande a été confirmée.',
      sessionId: 'ID de session',
      backHome: 'Retour à l\'accueil',
      viewOrders: 'Voir mes commandes',
    },
    en: {
      title: 'Payment successful!',
      message: 'Your order has been confirmed.',
      sessionId: 'Session ID',
      backHome: 'Back to home',
      viewOrders: 'View my orders',
    },
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.title}</h1>
          <p className="text-xl text-gray-600 mb-2">{currentTexts.message}</p>
          {sessionId && (
            <p className="text-sm text-gray-500 mb-8">
              {currentTexts.sessionId}: {sessionId}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.backHome}
            </Link>
          </div>
        </div>
      </main>
      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}

