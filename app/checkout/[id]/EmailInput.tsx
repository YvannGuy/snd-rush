'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';
import { Mail } from 'lucide-react';

interface EmailInputProps {
  onEmailChange: (email: string) => void;
  initialEmail?: string;
}

/**
 * Composant pour saisir l'email obligatoire si l'utilisateur n'est pas connecté
 */
export function EmailInput({ onEmailChange, initialEmail }: EmailInputProps) {
  const { user, loading } = useUser();
  const [email, setEmail] = useState<string>(initialEmail || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si l'utilisateur est connecté, utiliser son email
    if (user?.email) {
      const emailValue = user.email || '';
      setEmail(emailValue);
      onEmailChange(emailValue);
    } else if (initialEmail) {
      const emailValue = initialEmail || '';
      setEmail(emailValue);
      onEmailChange(emailValue);
    }
    // Note: On ne met pas à jour email à '' dans le else car cela pourrait causer
    // un changement d'uncontrolled à controlled si email était déjà ''
  }, [user, initialEmail, onEmailChange]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value || '';
    setEmail(newEmail);
    setError(null);

    if (newEmail && !validateEmail(newEmail)) {
      setError('Veuillez entrer une adresse email valide');
      onEmailChange('');
    } else if (newEmail && validateEmail(newEmail)) {
      setError(null);
      onEmailChange(newEmail);
    } else {
      onEmailChange('');
    }
  };

  // Si l'utilisateur est connecté, ne pas afficher le champ
  if (loading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Chargement..."
          disabled
          className="w-full"
        />
      </div>
    );
  }

  if (user?.email) {
    // Utilisateur connecté : afficher l'email en lecture seule
    return (
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">{user.email}</span>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté : champ obligatoire
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-gray-900">
        Email <span className="text-[#F2431E]">*</span>
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="votre.email@exemple.com"
        value={email || ''}
        onChange={handleEmailChange}
        required
        className={`w-full ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-xs text-gray-600">
        Cet email sera utilisé pour recevoir la confirmation de paiement et les détails de votre réservation.
      </p>
    </div>
  );
}

