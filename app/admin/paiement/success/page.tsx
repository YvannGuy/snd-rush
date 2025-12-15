'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminPaymentSuccessPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Rediriger vers le dashboard admin après 3 secondes
    const redirectTimeout = setTimeout(() => {
      router.push('/admin/paiement?success=true');
    }, 3000);

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  const texts = {
    fr: {
      title: 'Paiement réussi !',
      message: 'Votre paiement a été confirmé avec succès.',
      messageProducts: 'Le paiement des produits a été effectué.',
      messageDeposit: 'L\'autorisation de caution a été effectuée.',
      redirecting: 'Redirection vers le dashboard...',
      sessionId: 'ID de session',
      backToDashboard: 'Retour au dashboard',
    },
    en: {
      title: 'Payment successful!',
      message: 'Your payment has been successfully confirmed.',
      messageProducts: 'Product payment has been processed.',
      messageDeposit: 'Deposit authorization has been processed.',
      redirecting: 'Redirecting to dashboard...',
      sessionId: 'Session ID',
      backToDashboard: 'Back to dashboard',
    },
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[150px] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.title}</h1>
          <p className="text-xl text-gray-600 mb-2">{currentTexts.message}</p>
          <p className="text-lg text-gray-500 mb-4">{currentTexts.messageProducts}</p>
          <p className="text-lg text-gray-500 mb-6">{currentTexts.messageDeposit}</p>
          
          {sessionId && (
            <p className="text-sm text-gray-500 mb-8">
              {currentTexts.sessionId}: {sessionId.slice(0, 20)}...
            </p>
          )}
          
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F2431E] mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">{currentTexts.redirecting}</p>
          </div>
          
          <Link
            href="/admin/paiement?success=true"
            className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
          >
            {currentTexts.backToDashboard}
          </Link>
        </div>
      </main>
      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
