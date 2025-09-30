'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ReservationSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler un délai de chargement
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e27431] mx-auto mb-4"></div>
          <p className="text-gray-600">Traitement de votre paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icône de succès */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement réussi ! 🎉
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Votre acompte de 30% a été prélevé avec succès. 
          Notre équipe va traiter votre réservation et vous contacter dans les plus brefs délais.
        </p>

        {/* Détails de la session */}
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Référence de paiement :</p>
            <p className="text-sm font-mono text-gray-700">{sessionId}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-[#e27431] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#e27431]/90 transition-colors inline-block"
          >
            Retour au site
          </Link>
          
          <p className="text-sm text-gray-500">
            Vous recevrez un email de confirmation sous peu.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReservationSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e27431] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ReservationSuccessContent />
    </Suspense>
  );
}