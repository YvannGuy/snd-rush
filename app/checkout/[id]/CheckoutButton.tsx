'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  reservationId: string;
  paymentType?: 'deposit' | 'balance'; // 'deposit' pour acompte, 'balance' pour solde
}

/**
 * Composant client pour gérer le paiement Stripe (Phase suivante - Paiement en 3 temps)
 */
export function CheckoutButton({ reservationId, paymentType = 'deposit' }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Déterminer quelle API appeler selon le type de paiement
      const apiEndpoint = paymentType === 'balance' 
        ? '/api/payments/create-balance-session'
        : '/api/payments/create-checkout-session';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('URL de paiement non reçue');
      }

      // Rediriger vers Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('[CHECKOUT] Erreur paiement:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const buttonText = paymentType === 'balance' 
    ? 'Payer le solde maintenant'
    : 'Payer l\'acompte (30%)';

  return (
    <div className="space-y-2">
      <Button 
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white text-lg py-6 font-semibold"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Traitement...
          </>
        ) : (
          buttonText
        )}
      </Button>
      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
