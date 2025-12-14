'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface ChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  language: 'fr' | 'en';
  onSuccess: () => void;
}

export default function ChangeRequestModal({
  isOpen,
  onClose,
  reservation,
  language,
  onSuccess,
}: ChangeRequestModalProps) {
  const [newLocation, setNewLocation] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reservation) return null;

  const texts = {
    fr: {
      title: 'Demande de modification',
      cgv: 'Les modifications (lieu ou horaires) sont possibles jusqu\'à 5 jours avant, sous réserve de disponibilité et d\'accord écrit.',
      newLocation: 'Nouveau lieu (facultatif)',
      newHours: 'Nouveaux horaires (facultatif)',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      request: 'Votre demande (obligatoire)',
      requestPlaceholder: 'Expliquez ce que vous souhaitez changer',
      send: 'Envoyer la demande',
      cancel: 'Retour',
      success: 'Votre demande de modification a bien été envoyée. Nous vous recontactons rapidement.',
      error: 'Une erreur est survenue. Veuillez réessayer.',
      required: 'Le champ "Votre demande" est obligatoire.',
    },
    en: {
      title: 'Change request',
      cgv: 'Changes (location or hours) are possible up to 5 days before, subject to availability and written agreement.',
      newLocation: 'New location (optional)',
      newHours: 'New hours (optional)',
      startTime: 'Start time',
      endTime: 'End time',
      request: 'Your request (required)',
      requestPlaceholder: 'Explain what you would like to change',
      send: 'Send request',
      cancel: 'Back',
      success: 'Your change request has been sent. We will contact you shortly.',
      error: 'An error occurred. Please try again.',
      required: 'The "Your request" field is required.',
    },
  };

  const currentTexts = texts[language];

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError(currentTexts.required);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestedChanges: any = {};
      if (newLocation.trim()) requestedChanges.location = newLocation.trim();
      if (newStartTime.trim()) requestedChanges.startTime = newStartTime.trim();
      if (newEndTime.trim()) requestedChanges.endTime = newEndTime.trim();

      const response = await fetch(`/api/reservations/${reservation.id}/change-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          requestedAt: new Date().toISOString(),
          requestedChanges,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || currentTexts.error);
      }

      onSuccess();
      onClose();
      setNewLocation('');
      setNewStartTime('');
      setNewEndTime('');
      setMessage('');
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
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* CGV */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">{currentTexts.cgv}</p>
          </div>

          {/* Nouveau lieu */}
          <div className="space-y-2">
            <Label htmlFor="new-location">{currentTexts.newLocation}</Label>
            <AddressAutocomplete
              id="new-location"
              value={newLocation}
              onChange={setNewLocation}
              placeholder={language === 'fr' ? 'Commencez à taper une adresse...' : 'Start typing an address...'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Nouveaux horaires */}
          <div className="space-y-4">
            <Label>{currentTexts.newHours}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm">{currentTexts.startTime}</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm">{currentTexts.endTime}</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Message obligatoire */}
          <div className="space-y-2">
            <Label htmlFor="message">{currentTexts.request}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentTexts.requestPlaceholder}
              rows={4}
              required
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
              disabled={!message.trim() || isSubmitting}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Envoi...' : 'Sending...'}
                </>
              ) : (
                currentTexts.send
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
