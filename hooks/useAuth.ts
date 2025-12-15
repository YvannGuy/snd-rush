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
      return origin;
    }
    
    // Côté serveur, utiliser NEXT_PUBLIC_BASE_URL ou localhost par défaut
    // Mais en développement, forcer localhost
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
      const redirectUrl = hasCart 
        ? `${getBaseUrl()}/auth/callback?has_cart=true`
        : `${getBaseUrl()}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
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
      const { data, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getBaseUrl()}/auth/callback`,
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
      const redirectUrl = `${baseUrl}/reinitialiser-mot-de-passe`;
      
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

