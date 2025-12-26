'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: 'fr' | 'en';
}

export default function PasswordSetupModal({ isOpen, onClose, onSuccess, language = 'fr' }: PasswordSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    fr: {
      title: 'Créer votre mot de passe',
      description: 'Votre compte a été créé automatiquement. Veuillez définir un mot de passe permanent pour sécuriser votre compte.',
      newPassword: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      passwordPlaceholder: 'Minimum 8 caractères',
      confirmPlaceholder: 'Répétez le mot de passe',
      later: 'Plus tard',
      creating: 'Création...',
      created: '✅ Créé !',
      createButton: 'Créer mon mot de passe',
      successMessage: '✅ Mot de passe créé avec succès !',
      errorPasswordLength: 'Le mot de passe doit contenir au moins 8 caractères',
      errorPasswordMatch: 'Les mots de passe ne correspondent pas',
      errorUpdate: 'Erreur lors de la mise à jour du mot de passe',
      errorGeneric: 'Une erreur est survenue lors de la mise à jour du mot de passe',
      errorSupabase: 'Supabase non initialisé'
    },
    en: {
      title: 'Create your password',
      description: 'Your account has been created automatically. Please set a permanent password to secure your account.',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      passwordPlaceholder: 'Minimum 8 characters',
      confirmPlaceholder: 'Repeat password',
      later: 'Later',
      creating: 'Creating...',
      created: '✅ Created!',
      createButton: 'Create my password',
      successMessage: '✅ Password created successfully!',
      errorPasswordLength: 'Password must contain at least 8 characters',
      errorPasswordMatch: 'Passwords do not match',
      errorUpdate: 'Error updating password',
      errorGeneric: 'An error occurred while updating the password',
      errorSupabase: 'Supabase not initialized'
    }
  };

  const currentTexts = texts[language];

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!password || password.length < 8) {
      setError(currentTexts.errorPasswordLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(currentTexts.errorPasswordMatch);
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error(currentTexts.errorSupabase);
      }

      // Mettre à jour le mot de passe de l'utilisateur
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message || currentTexts.errorUpdate);
      }

      // Mettre à jour les métadonnées pour indiquer que le mot de passe a été configuré
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          needs_password_setup: false,
        },
      });

      if (metadataError) {
        console.warn('Erreur mise à jour métadonnées (non bloquant):', metadataError);
      }

      setSuccess(true);
      
      // Fermer le modal après 1 seconde
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Erreur mise à jour mot de passe:', err);
      setError(err.message || currentTexts.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-[#F2431E]/10 rounded-full mb-4 mx-auto">
            <Lock className="h-6 w-6 text-[#F2431E]" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {currentTexts.title}
          </h2>
          <p className="text-center text-gray-600 text-sm">
            {currentTexts.description}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {currentTexts.successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {currentTexts.newPassword}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={currentTexts.passwordPlaceholder}
                className="pr-10"
                disabled={isLoading || success}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading || success}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {currentTexts.confirmPassword}
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={currentTexts.confirmPlaceholder}
                className="pr-10"
                disabled={isLoading || success}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading || success}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || success}
              className="flex-1"
            >
              {currentTexts.later}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || success || !password || !confirmPassword}
              className="flex-1 bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentTexts.creating}
                </>
              ) : success ? (
                currentTexts.created
              ) : (
                currentTexts.createButton
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

