'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MagicLinkPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const safeRedirect = useMemo(() => {
    if (!redirectUrl) return null;
    try {
      // Valider l'URL pour éviter les erreurs Safari "adresse invalide"
      const url = new URL(redirectUrl);
      return url.toString();
    } catch (e) {
      console.error('[MAGIC-LINK-PAGE] URL invalide reçue:', redirectUrl);
      setStatus('error');
      setErrorMessage('Lien de redirection invalide. Merci de réessayer ou de contacter le support.');
      return null;
    }
  }, [redirectUrl]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token manquant');
      return;
    }

    // Appeler l'API qui va créer le compte et générer le magic link
    const handleMagicLink = async () => {
      try {
        console.log('[MAGIC-LINK-PAGE] Appel API avec token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`/api/auth/magic-link/${token}`, {
          method: 'GET',
        });
        setHttpStatus(response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors du traitement du lien magique');
        }

        const data = await response.json();
        console.log('[MAGIC-LINK-PAGE] Réponse API:', data);

        const redirect = data.redirectUrl || '/dashboard';
        console.log('[MAGIC-LINK-PAGE] Status HTTP:', response.status);
        console.log('[MAGIC-LINK-PAGE] Token reçu (20 premiers chars):', token.substring(0, 20) + '...');
        console.log('[MAGIC-LINK-PAGE] redirectUrl reçu:', redirect);
        setRedirectUrl(redirect);
      } catch (error: any) {
        console.error('[MAGIC-LINK-PAGE] Erreur:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Une erreur est survenue lors du traitement du lien magique');
      }
    };

    handleMagicLink();
  }, [token]);

  // Redirection automatique via window.location.replace (plus fiable sur Safari)
  useEffect(() => {
    if (safeRedirect) {
      console.log('[MAGIC-LINK-PAGE] Redirection automatique vers:', safeRedirect.substring(0, 100) + '...');
      setTimeout(() => {
        window.location.replace(safeRedirect);
      }, 50);
    }
  }, [safeRedirect]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#F2431E] mx-auto mb-4" />
          <p className="text-gray-600">Traitement de votre lien magique...</p>
          {safeRedirect && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">Redirection en cours...</p>
              <a
                href={safeRedirect}
                className="inline-flex items-center text-sm text-[#F2431E] underline"
              >
                Continuer
              </a>
              {httpStatus !== null && (
                <p className="text-xs text-gray-400">HTTP: {httpStatus}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Erreur</h2>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-[#F2431E] text-white rounded-lg hover:bg-[#E63A1A]"
              >
                Retour à l'accueil
              </button>
              {safeRedirect && (
                <a
                  href={safeRedirect}
                  className="px-4 py-2 border border-[#F2431E] text-[#F2431E] rounded-lg hover:bg-[#F2431E]/5"
                >
                  Continuer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

