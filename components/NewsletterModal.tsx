'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
}

export default function NewsletterModal({ isOpen, onClose, language }: NewsletterModalProps) {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mettre à jour l'email quand l'utilisateur change ou quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const texts = {
    fr: {
      title: 'Inscription newsletter',
      greeting: (name: string) => `Bonjour, ${name.toUpperCase()}`,
      emailLabel: 'Email *',
      noThanks: 'Non, merci',
      subscribe: "Je m'inscris",
      success: 'Inscription réussie ! Vous recevrez bientôt nos newsletters.',
      error: 'Une erreur est survenue. Veuillez réessayer.',
      invalidEmail: 'Veuillez entrer une adresse email valide.'
    },
    en: {
      title: 'Newsletter subscription',
      greeting: (name: string) => `Hello, ${name.toUpperCase()}`,
      emailLabel: 'Email *',
      noThanks: 'No, thanks',
      subscribe: 'I subscribe',
      success: 'Subscription successful! You will soon receive our newsletters.',
      error: 'An error occurred. Please try again.',
      invalidEmail: 'Please enter a valid email address.'
    }
  };

  const currentTexts = texts[language];

  const handleSubscribe = async () => {
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setMessage({ type: 'error', text: currentTexts.invalidEmail });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: currentTexts.success });
        setTimeout(() => {
          onClose();
          setEmail('');
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || currentTexts.error });
      }
    } catch (error) {
      console.error('Erreur inscription newsletter:', error);
      setMessage({ type: 'error', text: currentTexts.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail(user?.email || '');
    setMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-gray-900 text-white p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white">{currentTexts.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Greeting */}
          {user?.email && (
            <p className="text-gray-700 font-medium">
              {currentTexts.greeting(user.email.split('@')[0])}
            </p>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="newsletter-email" className="text-sm font-medium text-gray-700">
              {currentTexts.emailLabel}
            </label>
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-300"
            >
              {currentTexts.noThanks}
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white border-[#F2431E]"
            >
              {isSubmitting ? '...' : currentTexts.subscribe}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
