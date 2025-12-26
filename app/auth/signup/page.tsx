'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SignModal from '@/components/auth/SignModal';
import { useUser } from '@/hooks/useUser';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservation_id');
  const { user, loading } = useUser();

  const [isOpen, setIsOpen] = useState(true);
  const [prefillEmail, setPrefillEmail] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  const attachReservation = useCallback(async () => {
    if (!reservationId) return;
    try {
      setIsAttaching(true);
      await fetch('/api/reservations/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId }),
      });
    } catch (err) {
      console.warn('⚠️ attach reservation failed (non bloquant):', err);
    } finally {
      setIsAttaching(false);
    }
  }, [reservationId]);

  // Si déjà connecté, attacher et rediriger
  useEffect(() => {
    if (loading) return;
    if (user) {
      (async () => {
        await attachReservation();
        router.push('/dashboard');
      })();
    }
  }, [user, loading, attachReservation, router]);

  // Pré-remplir l'email depuis la réservation publique
  useEffect(() => {
    const loadReservationEmail = async () => {
      if (!reservationId) return;
      try {
        const res = await fetch(`/api/reservations/public/${reservationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.customer_email) {
          setPrefillEmail(data.customer_email);
        }
      } catch (err) {
        console.warn('⚠️ Impossible de pré-remplir l’email', err);
      }
    };
    loadReservationEmail();
  }, [reservationId]);

  const handleSuccess = async () => {
    await attachReservation();
    router.push('/dashboard');
  };

  const handleClose = () => {
    setIsOpen(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Créer mon compte</h1>
          <p className="text-gray-600 mt-2">
            Finalisez votre compte pour accéder à votre réservation et à votre dashboard.
          </p>
          {reservationId && (
            <p className="text-sm text-gray-500 mt-1">
              Réservation : {reservationId}
            </p>
          )}
        </div>

        <SignModal
          isOpen={isOpen}
          onClose={handleClose}
          prefillEmail={prefillEmail}
          initialTab="signup"
          onSuccess={handleSuccess}
          language="fr"
        />

        {isAttaching && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Association de votre réservation en cours...
          </p>
        )}
      </div>
    </div>
  );
}

