'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function SignContractContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useUser();
  const [reservationId, setReservationId] = useState('');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    const reservationIdParam = searchParams.get('reservationId');
    if (reservationIdParam) setReservationId(reservationIdParam);
  }, [searchParams]);

  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  const handleSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signature.trim()) {
      setError(language === 'fr' ? 'Veuillez signer le contrat' : 'Please sign the contract');
      return;
    }

    if (!reservationId) {
      setError(language === 'fr' ? 'ID de réservation manquant' : 'Missing reservation ID');
      return;
    }

    if (!user) {
      setError(language === 'fr' ? 'Vous devez être connecté pour signer le contrat' : 'You must be logged in to sign the contract');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      if (!user || !user.id) {
        throw new Error(language === 'fr' ? 'Vous devez être connecté pour signer le contrat' : 'You must be logged in to sign the contract');
      }

      const requestBody = {
        reservationId,
        signature: signature.trim(),
        signedAt: new Date().toISOString(),
        userId: user.id
      };

      console.log('Envoi signature:', { reservationId, userId: user.id, hasSignature: !!signature.trim() });

      const response = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setIsSigned(true);
        setTimeout(() => {
          router.push('/mes-reservations');
        }, 3000);
      } else {
        console.error('Erreur API signature:', data);
        throw new Error(data.error || (language === 'fr' ? 'Erreur lors de la signature' : 'Error signing contract'));
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.message || (language === 'fr' ? 'Erreur lors de la signature. Veuillez réessayer.' : 'Error signing contract. Please try again.'));
    } finally {
      setIsSigning(false);
    }
  };

  const texts = {
    fr: {
      title: 'Signature du contrat de location',
      subtitle: 'SND Rush - Location Sono & Événementiel',
      signatureLabel: 'Votre signature',
      signaturePlaceholder: 'Tapez votre nom complet pour signer',
      signatureNote: 'En signant, vous acceptez les conditions générales de location et confirmez votre accord avec ce contrat.',
      signButton: 'Signer le contrat',
      signing: 'Signature en cours...',
      signed: 'Contrat signé avec succès !',
      successMessage: 'Merci pour votre signature. Votre contrat a été enregistré et vous pouvez le télécharger depuis votre espace client.',
      legalNote: '🔒 Cette signature a une valeur légale. En signant, vous confirmez votre accord avec les conditions du contrat.',
      redirecting: 'Redirection vers vos réservations...',
    },
    en: {
      title: 'Sign rental contract',
      subtitle: 'SND Rush - Sound Rental & Events',
      signatureLabel: 'Your signature',
      signaturePlaceholder: 'Type your full name to sign',
      signatureNote: 'By signing, you accept the rental terms and conditions and confirm your agreement with this contract.',
      signButton: 'Sign contract',
      signing: 'Signing...',
      signed: 'Contract signed successfully!',
      successMessage: 'Thank you for your signature. Your contract has been saved and you can download it from your client area.',
      legalNote: '🔒 This signature has legal value. By signing, you confirm your agreement with the contract terms.',
      redirecting: 'Redirecting to your reservations...',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
            <p className="mt-4 text-gray-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isSigned) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex items-center justify-center min-h-[60vh] py-12">
        <div className="bg-white rounded-2xl p-8 sm:p-12 max-w-2xl mx-4 text-center shadow-lg">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">{currentTexts.signed}</h1>
          <p className="text-lg text-gray-600 mb-6">
            {currentTexts.successMessage}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
            📄 {language === 'fr' ? 'Vous pouvez maintenant télécharger votre contrat signé depuis la page "Mes réservations".' : 'You can now download your signed contract from the "My reservations" page.'}
            </p>
          </div>
          <p className="text-sm text-gray-500">{currentTexts.redirecting}</p>
        </div>
      </div>
      <Footer language={language} />
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex items-center justify-center min-h-[60vh] py-12">
        <div className="bg-white rounded-2xl p-6 sm:p-10 max-w-2xl mx-4 w-full shadow-lg">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✍️</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{currentTexts.title}</h1>
            <p className="text-gray-600">{currentTexts.subtitle}</p>
          </div>

          <form onSubmit={handleSignature} className="space-y-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {currentTexts.signatureLabel}
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={currentTexts.signaturePlaceholder}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none text-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {currentTexts.signatureNote}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSigning || !signature.trim() || !user || loading}
              className="w-full bg-[#F2431E] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigning ? currentTexts.signing : currentTexts.signButton}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 text-center">
            <p>{currentTexts.legalNote}</p>
          </div>
        </div>
      </div>
      <Footer language={language} />
    </div>
  );
}

export default function SignContractPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SignContractContent />
    </Suspense>
  );
}

