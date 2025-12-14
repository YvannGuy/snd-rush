'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateRefundPolicy } from '@/lib/reservationStatus';
import { Loader2 } from 'lucide-react';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  language: 'fr' | 'en';
  onSuccess: () => void;
}

export default function CancelRequestModal({
  isOpen,
  onClose,
  reservation,
  language,
  onSuccess,
}: CancelRequestModalProps) {
  const [reason, setReason] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reservation) return null;

  const eventDate = new Date(reservation.start_date);
  const { policy, daysUntilEvent, refundPercentage } = calculateRefundPolicy(eventDate);
  const totalPaid = parseFloat(reservation.total_price || 0);
  const refundEstimate = policy !== 'NONE' ? (totalPaid * refundPercentage) / 100 : 0;

  const { startTime, endTime } = (() => {
    if (!reservation.notes) return { startTime: null, endTime: null };
    try {
      const parsed = JSON.parse(reservation.notes);
      return {
        startTime: parsed.startTime || null,
        endTime: parsed.endTime || null,
      };
    } catch {
      return { startTime: null, endTime: null };
    }
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time;
  };

  const texts = {
    fr: {
      title: 'Demande d\'annulation',
      subtitle: 'Récapitulatif et conditions de remboursement',
      recap: {
        reservation: 'Réservation',
        date: 'Date',
        hours: 'Horaires',
        location: 'Lieu',
        amountPaid: 'Montant payé',
      },
      conditions: {
        title: 'Conditions d\'annulation',
        moreThan7: 'Plus de 7 jours avant : remboursement intégral.',
        between3And7: 'Entre 3 et 7 jours avant : remboursement à hauteur de 50 %.',
        lessThan3: 'Moins de 3 jours avant : aucun remboursement.',
        result: (percentage: number) => 
          percentage > 0 
            ? `Selon la date de votre événement, le remboursement applicable est : **${percentage} %**.`
            : 'Selon la date de votre événement, aucun remboursement n\'est possible.',
      },
      deposit: 'La caution n\'est pas débitée tant que la location n\'a pas lieu.',
      checkbox: 'J\'ai lu et j\'accepte les conditions d\'annulation.',
      reason: 'Motif (facultatif)',
      confirm: 'Confirmer la demande d\'annulation',
      cancel: 'Retour',
      success: 'Votre demande d\'annulation a bien été envoyée. Nous revenons vers vous rapidement.',
      error: 'Une erreur est survenue. Veuillez réessayer.',
    },
    en: {
      title: 'Cancellation request',
      subtitle: 'Summary and refund conditions',
      recap: {
        reservation: 'Reservation',
        date: 'Date',
        hours: 'Hours',
        location: 'Location',
        amountPaid: 'Amount paid',
      },
      conditions: {
        title: 'Cancellation conditions',
        moreThan7: 'More than 7 days before: full refund.',
        between3And7: 'Between 3 and 7 days before: 50% refund.',
        lessThan3: 'Less than 3 days before: no refund.',
        result: (percentage: number) => 
          percentage > 0 
            ? `According to your event date, the applicable refund is: **${percentage}%**.`
            : 'According to your event date, no refund is possible.',
      },
      deposit: 'The deposit is not charged until the rental takes place.',
      checkbox: 'I have read and accept the cancellation conditions.',
      reason: 'Reason (optional)',
      confirm: 'Confirm cancellation request',
      cancel: 'Back',
      success: 'Your cancellation request has been sent. We will get back to you shortly.',
      error: 'An error occurred. Please try again.',
    },
  };

  const currentTexts = texts[language];
  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();

  const handleSubmit = async () => {
    if (!accepted) {
      setError(language === 'fr' ? 'Vous devez accepter les conditions d\'annulation.' : 'You must accept the cancellation conditions.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reservations/${reservation.id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          requestedAt: new Date().toISOString(),
          reason: reason.trim() || null,
          refundPolicyApplied: policy,
          refundEstimateAmount: refundEstimate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || currentTexts.error);
      }

      onSuccess();
      onClose();
      setReason('');
      setAccepted(false);
    } catch (err: any) {
      setError(err.message || currentTexts.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentTexts.title}</DialogTitle>
          <DialogDescription>{currentTexts.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">{currentTexts.recap.reservation}:</span>
                <span className="font-semibold ml-2">#{reservationNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">{currentTexts.recap.date}:</span>
                <span className="font-semibold ml-2">{formatDate(reservation.start_date)}</span>
              </div>
              <div>
                <span className="text-gray-600">{currentTexts.recap.hours}:</span>
                <span className="font-semibold ml-2">
                  {formatTime(startTime) || '—'} → {formatTime(endTime) || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{currentTexts.recap.location}:</span>
                <span className="font-semibold ml-2">{reservation.address || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">{currentTexts.recap.amountPaid}:</span>
                <span className="font-semibold ml-2">{totalPaid.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{currentTexts.conditions.title}</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• {currentTexts.conditions.moreThan7}</li>
              <li>• {currentTexts.conditions.between3And7}</li>
              <li>• {currentTexts.conditions.lessThan3}</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-amber-900">
                {currentTexts.conditions.result(refundPercentage)}
              </p>
              {refundEstimate > 0 && (
                <p className="text-sm text-amber-700 mt-2">
                  Montant estimé remboursé : <strong>{refundEstimate.toFixed(2)} €</strong>
                </p>
              )}
            </div>
          </div>

          {/* Info caution */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">{currentTexts.deposit}</p>
          </div>

          {/* Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="accept-conditions"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label
              htmlFor="accept-conditions"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              {currentTexts.checkbox}
            </Label>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="reason">{currentTexts.reason}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'fr' ? 'Expliquez votre motif (optionnel)' : 'Explain your reason (optional)'}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {currentTexts.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!accepted || isSubmitting}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Envoi...' : 'Sending...'}
                </>
              ) : (
                currentTexts.confirm
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
