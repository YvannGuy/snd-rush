'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/hooks/useUser';

export default function CartSuccessPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const { user } = useUser();
  const sessionId = searchParams.get('session_id');
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    
    // Vider le panier une seule fois au montage
    clearCart();
    
    // Marquer dans sessionStorage que le panier a été vidé (persiste pendant la session)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cart_cleared', 'true');
      // Vider aussi le localStorage pour être sûr
      localStorage.removeItem('sndrush_cart');
    }
    
    // Vérifier périodiquement si l'order a été créé par le webhook
    setIsCheckingOrder(true);
    let attempts = 0;
    const maxAttempts = 5;
    let timeoutId: NodeJS.Timeout | null = null;
    let redirectTimeoutId: NodeJS.Timeout | null = null;
    
    const checkOrder = async () => {
      try {
        const response = await fetch(`/api/verify-order?session_id=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.orderExists) {
          setOrderCreated(true);
          setIsCheckingOrder(false);
          
          // Rediriger vers le dashboard après 1 seconde si l'utilisateur est connecté
          redirectTimeoutId = setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkOrder, 1500);
        } else {
          setIsCheckingOrder(false);
        }
      } catch (error) {
        console.error('Erreur vérification order:', error);
        setIsCheckingOrder(false);
      }
    };
    
    // Démarrer la vérification après 3 secondes
    timeoutId = setTimeout(checkOrder, 3000);
    
    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (redirectTimeoutId) clearTimeout(redirectTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Ne garder que sessionId dans les dépendances

  const texts = {
    fr: {
      title: 'Paiement réussi !',
      message: 'Votre commande a été confirmée.',
      processing: 'Traitement de votre commande...',
      sessionId: 'ID de session',
      backHome: 'Retour à l\'accueil',
      viewDashboard: 'Voir mon dashboard',
      viewOrders: 'Voir mes commandes',
    },
    en: {
      title: 'Payment successful!',
      message: 'Your order has been confirmed.',
      processing: 'Processing your order...',
      sessionId: 'Session ID',
      backHome: 'Back to home',
      viewDashboard: 'View my dashboard',
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
          
          {isCheckingOrder ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.processing}</p>
            </>
          ) : (
            <>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.message}</p>
              {orderCreated && user && (
                <p className="text-sm text-green-600 mb-4">✓ Redirection vers votre dashboard...</p>
              )}
            </>
          )}
          
          {sessionId && (
            <p className="text-sm text-gray-500 mb-8">
              {currentTexts.sessionId}: {sessionId.slice(0, 20)}...
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user && (
              <Link
                href="/dashboard"
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.viewDashboard}
              </Link>
            )}
            <Link
              href="/"
              className="inline-block bg-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors"
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

