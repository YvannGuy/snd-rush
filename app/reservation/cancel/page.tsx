'use client';

import Link from 'next/link';

export default function ReservationCancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icône d'annulation */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Votre paiement a été annulé. Aucun montant n'a été prélevé.
          Vous pouvez recommencer votre réservation à tout moment.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-[#e27431] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#e27431]/90 transition-colors inline-block"
          >
            Retour au site
          </Link>
          
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-block"
          >
            Nouvelle réservation
          </Link>
        </div>
      </div>
    </div>
  );
}