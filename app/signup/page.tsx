'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SignModal from '@/components/auth/SignModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [redirect, setRedirect] = useState('/dashboard');

  useEffect(() => {
    // Récupérer l'email depuis les query params
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Récupérer la redirection depuis les query params
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      setRedirect(decodeURIComponent(redirectParam));
    }
  }, [searchParams]);

  const handleSuccess = () => {
    // Attendre un peu pour que la session soit bien établie
    setTimeout(() => {
      // Rediriger vers la page demandée après inscription réussie
      window.location.href = redirect;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language="fr" onLanguageChange={() => {}} />
      
      <main className="flex-1 flex items-center justify-center pt-[112px] px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Créer votre compte
            </h1>
            <p className="text-gray-600">
              {email 
                ? `Inscrivez-vous avec ${email} pour accéder à votre réservation`
                : 'Créez votre compte pour accéder à votre espace client'
              }
            </p>
          </div>
        </div>
      </main>

      <SignModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Rediriger vers la page d'accueil si l'utilisateur ferme le modal
          router.push('/');
        }}
        prefillEmail={email}
        initialTab="signup"
        onSuccess={handleSuccess}
        language="fr"
      />

      <Footer language="fr" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
