'use client';

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-close-line text-3xl text-yellow-600"></i>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>
        
        <p className="text-gray-600 mb-6">
          Votre paiement a été annulé. Vous pouvez réessayer à tout moment.
        </p>
        
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
