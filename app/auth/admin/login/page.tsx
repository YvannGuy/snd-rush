'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { user, loading: userLoading } = useUser();
  const { signInWithEmail, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Email autorisé pour l'administration
  const authorizedEmail = 'yvann.guyonnet@gmail.com';

  // Si déjà connecté et admin, rediriger
  useEffect(() => {
    if (userLoading) return;
    if (user) {
      // Vérifier si l'utilisateur est admin
      const isAdmin = user.email?.toLowerCase() === authorizedEmail.toLowerCase();
      if (isAdmin) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/admin');
        }
      }
    }
  }, [user, userLoading, router, redirectTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    
    if (!email || !password) return;

    // Vérifier si l'email est autorisé
    if (email.toLowerCase() !== authorizedEmail.toLowerCase()) {
      setAdminError('Vous n\'êtes pas autorisé à vous connecter en tant qu\'administrateur');
      return;
    }
    
    const result = await signInWithEmail(email, password);
    
    if (!result.error) {
      // Vérifier à nouveau après connexion
      if (result.data?.user?.email?.toLowerCase() === authorizedEmail.toLowerCase()) {
        // Rediriger vers l'admin
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/admin');
        }
      } else {
        setAdminError('Accès administrateur refusé');
      }
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#F2431E] mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F2431E] rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Administration
          </h1>
          <p className="text-gray-400">
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email administrateur
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAdminError(''); // Réinitialiser l'erreur quand l'email change
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur pour les emails non autorisés */}
            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {adminError}
              </div>
            )}

            {/* Message d'erreur général */}
            {error && !adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F2431E] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Avertissement sécurité */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              ⚠️ Toute tentative de connexion non autorisée sera enregistrée
            </p>
          </div>

          {/* Lien vers login utilisateur */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-[#F2431E] transition-colors"
            >
              ← Accès utilisateur
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#F2431E] mx-auto" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}

