'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from './useUser';

export function useAuth() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction helper pour obtenir l'URL de base correcte
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Toujours utiliser l'URL actuelle du navigateur en développement
      const origin = window.location.origin;
      
      // En développement local, forcer localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('0.0.0.0')) {
        if (origin.includes('0.0.0.0')) {
          return origin.replace('0.0.0.0', 'localhost');
        }
        return origin; // Retourner localhost:3000
      }
      
      // En production, utiliser l'URL actuelle ou NEXT_PUBLIC_BASE_URL
      // Valider que l'URL est valide
      try {
        new URL(origin);
        return origin;
      } catch {
        return 'http://localhost:3000';
      }
    }
    
    // Côté serveur, utiliser NEXT_PUBLIC_BASE_URL ou localhost par défaut
    // Mais en développement, forcer localhost
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    
    // Valider que NEXT_PUBLIC_BASE_URL est une URL valide
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
      new URL(baseUrl);
      return baseUrl;
    } catch {
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL invalide, utilisation de localhost par défaut');
      return 'http://localhost:3000';
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      setError('Supabase non configuré');
      return { error: 'Supabase non configuré' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: { title?: string; firstName?: string; lastName?: string; phone?: string }) => {
    if (!supabase) {
      setError('Supabase non configuré');
      return { error: 'Supabase non configuré' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Tentative d\'inscription pour:', email);

      // Vérifier s'il y a un panier dans localStorage pour rediriger vers le panier après validation
      const hasCart = typeof window !== 'undefined' && localStorage.getItem('sndrush_cart');
      
      // Construire l'URL de base de manière robuste
      let baseUrl = getBaseUrl();
      
      // S'assurer que baseUrl est valide
      try {
        const testUrl = new URL(baseUrl);
        baseUrl = testUrl.origin; // Utiliser seulement l'origin pour éviter les problèmes
      } catch {
        // Si getBaseUrl() retourne une URL invalide, utiliser window.location.origin
        baseUrl = typeof window !== 'undefined' 
          ? window.location.origin
          : 'http://localhost:3000';
        console.warn('⚠️ URL de base invalide, utilisation de:', baseUrl);
      }
      
      // Construire l'URL de redirection et y inclure reservation_id si présent dans l'URL actuelle
      const currentSearch =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const reservationId = currentSearch?.get('reservation_id');

      const redirectPath = '/auth/callback';
      const redirectUrl = new URL(redirectPath, baseUrl);
      if (reservationId) {
        redirectUrl.searchParams.set('reservation_id', reservationId);
      }
      let finalRedirectUrl = redirectUrl.toString();
      
      // Si on a un panier, on le stockera dans un cookie ou localStorage
      // et le callback le récupérera automatiquement
      if (hasCart && typeof window !== 'undefined') {
        // Stocker l'info dans sessionStorage pour que le callback puisse la récupérer
        sessionStorage.setItem('pending_cart_after_auth', 'true');
      }
      
      // Valider et normaliser l'URL finale
      try {
        const url = new URL(finalRedirectUrl);
        // S'assurer que l'URL est bien formée
        finalRedirectUrl = url.toString();
        console.log('✅ URL de redirection validée:', finalRedirectUrl);
      } catch (urlError) {
        console.error('❌ URL de redirection invalide:', finalRedirectUrl, urlError);
        // Utiliser une URL par défaut absolument valide
        finalRedirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : 'http://localhost:3000/auth/callback';
        console.log('⚠️ Utilisation de l\'URL par défaut:', finalRedirectUrl);
        
        // Valider à nouveau l'URL par défaut
        try {
          new URL(finalRedirectUrl);
        } catch {
          // Si même l'URL par défaut est invalide, utiliser localhost
          finalRedirectUrl = 'http://localhost:3000/auth/callback';
          console.error('❌ URL par défaut invalide, utilisation de localhost');
        }
      }

      // IMPORTANT: Encoder l'URL pour éviter les problèmes avec les paramètres de requête
      // Supabase va ajouter cette URL dans le paramètre redirect_to du lien de confirmation
      // Si l'URL contient déjà des paramètres (?has_cart=true), elle doit être encodée
      const encodedRedirectUrl = encodeURIComponent(finalRedirectUrl);
      
      console.log('📧 Envoi de l\'email de confirmation avec URL:', finalRedirectUrl);
      console.log('📧 URL encodée pour Supabase:', encodedRedirectUrl);
      console.log('📧 Détails URL:', {
        baseUrl,
        hasCart,
        finalRedirectUrl,
        encodedRedirectUrl,
        isValid: (() => {
          try {
            new URL(finalRedirectUrl);
            return true;
          } catch {
            return false;
          }
        })()
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Ne PAS encoder ici - Supabase s'en charge automatiquement
          // Mais on s'assure que l'URL est valide avant
          emailRedirectTo: finalRedirectUrl,
          data: {
            title: metadata?.title,
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
            phone: metadata?.phone,
          },
        },
      });

      // Logger les détails pour le débogage
      console.log('📧 Réponse Supabase signUp:', {
        user: data?.user ? 'Utilisateur créé' : 'Pas d\'utilisateur',
        session: data?.session ? 'Session créée' : 'Pas de session',
        error: signUpError ? {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
        } : null,
      });

      // Vérifier si l'utilisateur a été créé même en cas d'erreur
      if (data?.user && !signUpError) {
        console.log('✅ Utilisateur créé avec succès:', data.user.id);
      }

      // Si l'erreur concerne l'email mais que l'utilisateur existe, c'est OK
      if (signUpError) {
        // Vérifier si l'utilisateur existe quand même
        if (data?.user) {
          console.log('⚠️ Erreur email mais utilisateur créé:', signUpError.message);
          // Ne pas bloquer si l'utilisateur est créé
        } else {
          throw signUpError;
        }
      }

      // Créer le profil utilisateur si les métadonnées sont fournies
      if (data.user && metadata) {
        try {
          await supabase.from('user_profiles').insert({
            user_id: data.user.id,
            phone: metadata.phone || null,
            address: null,
            company: null,
          });
          console.log('✅ Profil utilisateur créé');
        } catch (profileError) {
          console.error('❌ Erreur création profil:', profileError);
          // Ne pas bloquer l'inscription si le profil échoue
        }
      }

      // Si l'utilisateur existe mais qu'il y a eu une erreur d'email, retourner un succès avec warning
      if (data?.user && signUpError) {
        return { 
          data, 
          error: null,
          warning: 'Votre compte a été créé, mais l\'email de confirmation n\'a pas pu être envoyé. Vous pouvez essayer de vous connecter directement.'
        };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('❌ Erreur complète lors de l\'inscription:', {
        message: err.message,
        status: err.status,
        name: err.name,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });

      // Gérer les erreurs spécifiques
      let errorMessage = err.message;
      
      if (err.message?.includes('email') || err.message?.includes('confirmation') || err.message?.includes('SMTP')) {
        // Si c'est juste un problème d'email mais que l'utilisateur existe, on considère ça comme un succès
        if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
          errorMessage = 'Cet email est déjà utilisé. Connectez-vous avec votre mot de passe.';
        } else if (err.message?.includes('SMTP') || err.message?.includes('smtp')) {
          errorMessage = 'Erreur de configuration email. Votre compte a peut-être été créé. Essayez de vous connecter. Si le problème persiste, contactez le support.';
        } else {
          // Pour les autres erreurs d'email, on affiche un message plus clair
          errorMessage = 'Erreur lors de l\'envoi de l\'email de confirmation. Votre compte a peut-être été créé. Essayez de vous connecter.';
        }
      }
      
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) {
      setError('Supabase non configuré');
      return { error: 'Supabase non configuré' };
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getBaseUrl();
      let redirectUrl = `${baseUrl}/auth/callback`;
      
      // Valider que l'URL est absolue et valide
      try {
        const url = new URL(redirectUrl);
        redirectUrl = url.toString();
        console.log('✅ URL de redirection magic link validée:', redirectUrl);
      } catch (urlError) {
        console.error('❌ URL de redirection invalide:', redirectUrl, urlError);
        // Utiliser une URL par défaut valide
        redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : 'http://localhost:3000/auth/callback';
        console.log('⚠️ Utilisation de l\'URL par défaut:', redirectUrl);
      }

      // S'assurer que l'URL est valide avant de l'envoyer à Supabase
      // Supabase encode automatiquement l'URL dans le lien de confirmation
      let finalRedirectUrl = redirectUrl;
      try {
        new URL(redirectUrl);
      } catch {
        // Si l'URL est invalide, utiliser une URL par défaut
        finalRedirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : 'http://localhost:3000/auth/callback';
        console.warn('⚠️ URL magic link invalide, utilisation de:', finalRedirectUrl);
      }

      const { data, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: finalRedirectUrl,
        },
      });

      if (magicLinkError) throw magicLinkError;

      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };


  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) {
      setError('Supabase non configuré');
      return { error: 'Supabase non configuré' };
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getBaseUrl();
      // Rediriger directement vers la page de réinitialisation
      // La page gérera le hash avec les tokens directement
      let redirectUrl = `${baseUrl}/reinitialiser-mot-de-passe`;
      
      // Valider que l'URL est absolue et valide
      try {
        const url = new URL(redirectUrl);
        redirectUrl = url.toString();
        console.log('✅ URL de redirection validée:', redirectUrl);
      } catch (urlError) {
        console.error('❌ URL de redirection invalide:', redirectUrl, urlError);
        // Utiliser une URL par défaut valide
        redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/reinitialiser-mot-de-passe`
          : 'http://localhost:3000/reinitialiser-mot-de-passe';
        console.log('⚠️ Utilisation de l\'URL par défaut:', redirectUrl);
      }
      
      console.log('🔐 Tentative de réinitialisation de mot de passe pour:', email);
      console.log('📍 URL de redirection:', redirectUrl);
      
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.error('❌ Erreur Supabase resetPasswordForEmail:', {
          message: resetError.message,
          status: resetError.status,
          name: resetError.name,
        });
        throw resetError;
      }

      console.log('✅ Email de réinitialisation envoyé avec succès');
      console.log('📧 Données retournées:', data);

      // Note: Supabase retourne toujours un succès même si l'email n'existe pas
      // pour des raisons de sécurité. L'email sera envoyé seulement si l'utilisateur existe.
      return { data, error: null };
    } catch (err: any) {
      console.error('❌ Erreur complète lors de la réinitialisation:', {
        message: err.message,
        status: err.status,
        name: err.name,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });

      // Gérer les erreurs spécifiques
      let errorMessage = err.message;
      
      if (err.message?.includes('SMTP') || err.message?.includes('smtp') || err.message?.includes('email')) {
        errorMessage = 'Erreur de configuration email. Veuillez vérifier que le service d\'email est configuré dans Supabase. Si le problème persiste, contactez le support.';
      } else if (err.message?.includes('rate limit') || err.message?.includes('too many')) {
        errorMessage = 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.';
      }
      
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      setError('Supabase non configuré');
      return { error: 'Supabase non configuré' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      // Forcer la déconnexion avec scope global pour déconnecter sur tous les onglets
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        throw error;
      }

      // Vider manuellement le localStorage lié à Supabase
      if (typeof window !== 'undefined') {
        // Supprimer toutes les clés Supabase du localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (err: any) {
      setError(err.message);
      throw err; // Propager l'erreur pour que le composant puisse la gérer
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}

