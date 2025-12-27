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
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  useEffect(() => {
    const reservationIdParam = searchParams.get('reservationId');
    const clientReservationIdParam = searchParams.get('clientReservationId');
    // Accepter soit reservationId (ancienne table) soit clientReservationId (nouvelle table)
    if (clientReservationIdParam) {
      setReservationId(clientReservationIdParam);
      // Stocker le type pour l'API
      (window as any).__isClientReservation = true;
    } else if (reservationIdParam) {
      setReservationId(reservationIdParam);
      (window as any).__isClientReservation = false;
    }
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

      // Déterminer si c'est une client_reservation ou une ancienne reservation
      const isClientReservation = (window as any).__isClientReservation === true;
      
      const requestBody: any = {
        signature: signature.trim(),
        signedAt: new Date().toISOString(),
        userId: user.id
      };
      
      // Ajouter le bon paramètre selon le type
      if (isClientReservation) {
        requestBody.clientReservationId = reservationId;
      } else {
        requestBody.reservationId = reservationId;
      }

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
          router.push('/dashboard/prestation');
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
      subtitle: 'SoundRush Paris - Location Sono & Événementiel',
      signatureLabel: 'Votre signature',
      signaturePlaceholder: 'Tapez votre nom complet pour signer',
      signatureNote: 'En signant, vous acceptez les conditions générales de location et confirmez votre accord avec ce contrat.',
      readContract: '📄 Lire le contrat avant de signer',
      signButton: 'Signer le contrat',
      signing: 'Signature en cours...',
      signed: 'Contrat signé avec succès !',
      successMessage: 'Merci pour votre signature. Votre contrat a été enregistré et vous pouvez le télécharger depuis votre espace client.',
      legalNote: '🔒 Cette signature a une valeur légale. En signant, vous confirmez votre accord avec les conditions du contrat.',
      redirecting: 'Redirection vers vos réservations...',
      contractModalTitle: 'Contrat de location',
      closeModal: 'Fermer',
    },
    en: {
      title: 'Sign rental contract',
      subtitle: 'SoundRush Paris - Sound Rental & Events',
      signatureLabel: 'Your signature',
      signaturePlaceholder: 'Type your full name to sign',
      signatureNote: 'By signing, you accept the rental terms and conditions and confirm your agreement with this contract.',
      readContract: '📄 Read the contract before signing',
      signButton: 'Sign contract',
      signing: 'Signing...',
      signed: 'Contract signed successfully!',
      successMessage: 'Thank you for your signature. Your contract has been saved and you can download it from your client area.',
      legalNote: '🔒 This signature has legal value. By signing, you confirm your agreement with the contract terms.',
      redirecting: 'Redirecting to your reservations...',
      contractModalTitle: 'Rental contract',
      closeModal: 'Close',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="flex items-center justify-center min-h-[60vh] pt-[150px]">
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
      <div className="flex items-center justify-center min-h-[60vh] pt-[150px] pb-12">
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
      <div className="flex items-center justify-center min-h-[60vh] pt-[150px] pb-8 sm:pb-12 px-4">
        <div className="bg-white rounded-2xl p-6 sm:p-10 max-w-2xl w-full shadow-lg overflow-visible">
          <div className="text-center mb-8 pt-2">
            <div className="text-5xl mb-4 leading-none">✍️</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{currentTexts.title}</h1>
            <p className="text-gray-600 text-sm sm:text-base">{currentTexts.subtitle}</p>
          </div>

          <form onSubmit={handleSignature} className="space-y-6">
            {/* Lien pour lire le contrat */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setIsContractModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors border-2 border-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {currentTexts.readContract}
              </button>
            </div>

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

      {/* Modal pour afficher le contrat */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setIsContractModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{currentTexts.contractModalTitle}</h2>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={currentTexts.closeModal}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal - PDF dans un iframe */}
            <div className="flex-1 overflow-hidden">
              {reservationId ? (() => {
                const isClientReservation = (window as any).__isClientReservation === true;
                const url = isClientReservation
                  ? `/api/contract/download?clientReservationId=${reservationId}&display=inline`
                  : `/api/contract/download?reservationId=${reservationId}&display=inline`;
                return (
                  <iframe
                    src={url}
                    className="w-full h-full min-h-[600px]"
                    title={currentTexts.contractModalTitle}
                    style={{ border: 'none' }}
                  />
                );
              })() : (
                <div className="flex items-center justify-center h-full p-8">
                  <p className="text-gray-500">{language === 'fr' ? 'Chargement du contrat...' : 'Loading contract...'}</p>
                </div>
              )}
            </div>

            {/* Footer du modal */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="px-6 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}

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

