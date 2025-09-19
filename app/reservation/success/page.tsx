'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Ici vous pouvez récupérer les détails de la session Stripe
      // et afficher les informations de confirmation
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-check-line text-3xl text-green-600"></i>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement confirmé !
        </h1>
        
        <p className="text-gray-600 mb-6">
          Votre acompte a été payé avec succès. Votre réservation est maintenant confirmée.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            <strong>Session ID:</strong> {sessionId}
          </p>
        </div>
        
        <button
          onClick={() => window.close()}
          className="w-full bg-[#F2431E] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F2431E]"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
