'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import SignModal from '@/components/auth/SignModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const reservationId = searchParams.get('reservation');
  const email = searchParams.get('email');

  useEffect(() => {
    if (loading) return;
    
    // Si l'utilisateur n'est pas connecté, ouvrir le modal de connexion
    if (!user) {
      setIsSignModalOpen(true);
      return;
    }
    
    // Si l'utilisateur est connecté, rediriger vers le dashboard avec le paramètre reservation
    if (user && reservationId) {
      router.push(`/dashboard?reservation=${reservationId}`);
    } else if (user) {
      router.push('/dashboard');
    }
  }, [user, loading, reservationId, router]);

  // Si l'utilisateur se connecte via le modal, rediriger après connexion
  const handleSignInSuccess = () => {
    setIsSignModalOpen(false);
    if (reservationId) {
      router.push(`/dashboard?reservation=${reservationId}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="flex-1 flex items-center justify-center pt-[112px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </main>
      
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={handleSignInSuccess}
      />
      
      <Footer language={language} />
    </div>
  );
}

