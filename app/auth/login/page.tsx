'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservation_id');
  const redirectTo = searchParams.get('redirect');
  const { user, loading: userLoading } = useUser();
  const { signInWithEmail, signUpWithEmail, loading, error } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  
  // Champs pour signup
  const [title, setTitle] = useState<'mr' | 'mme'>('mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('FR');
  const [phone, setPhone] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  // Liste des pays (simplifiée pour l'exemple)
  const countries = [
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
    { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
    { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
    { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  ];

  const attachReservation = useCallback(async () => {
    if (!reservationId || !user) return;
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
  }, [reservationId, user]);

  // Si déjà connecté, attacher et rediriger
  useEffect(() => {
    if (userLoading) return;
    if (user) {
      (async () => {
        await attachReservation();
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/dashboard');
        }
      })();
    }
  }, [user, userLoading, attachReservation, router, redirectTo]);

  // Pré-remplir l'email depuis la réservation publique
  useEffect(() => {
    const loadReservationEmail = async () => {
      if (!reservationId) return;
      try {
        const res = await fetch(`/api/reservations/public/${reservationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.customer_email) {
          setEmail(data.customer_email);
          setActiveTab('signin'); // Si réservation, privilégier signin
        }
      } catch (err) {
        console.warn('⚠️ Impossible de pré-remplir l\'email', err);
      }
    };
    loadReservationEmail();
  }, [reservationId]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;

    const result = await signInWithEmail(email, password);
    
    if (!result.error) {
      // Attacher la réservation si nécessaire
      if (reservationId) {
        await attachReservation();
      }
      // Rediriger
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/dashboard');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !phone || !email || !password) {
      return;
    }
    
    // Formater le numéro de téléphone avec l'indicatif
    const selectedCountry = countries.find(c => c.code === phoneCountry);
    const fullPhone = selectedCountry ? `${selectedCountry.dialCode} ${phone}` : phone;
    
    const result = await signUpWithEmail(email, password, {
      title,
      firstName,
      lastName,
      phone: fullPhone,
    });
    
    if (!result.error) {
      setSignUpSuccess(true);
      // Attacher la réservation si nécessaire
      if (reservationId) {
        await attachReservation();
      }
      // Rediriger après un court délai
      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    }
  };

  if (userLoading || isAttaching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#F2431E] mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'signin' 
              ? 'Connectez-vous à votre compte pour accéder à vos réservations'
              : 'Créez votre compte pour accéder à vos réservations et à votre dashboard'}
          </p>
          {reservationId && (
            <p className="text-sm text-gray-500 mt-2">
              Réservation : {reservationId}
            </p>
          )}
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'signin'
                  ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="p-6">
            {signUpSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Compte créé avec succès !
                </h3>
                <p className="text-gray-600 mb-4">
                  Votre compte a été créé avec succès et est prêt à être utilisé.
                </p>
                <p className="text-sm text-gray-500">
                  Redirection en cours...
                </p>
              </div>
            ) : activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email-signin" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email-signin"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password-signin" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password-signin"
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

                {error && (
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

                <div className="text-center">
                  <Link
                    href="/reinitialiser-mot-de-passe"
                    className="text-sm text-[#F2431E] hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Civilité
                    </label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value as 'mr' | 'mme')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    >
                      <option value="mr">M.</option>
                      <option value="mme">Mme</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                      placeholder="6 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="password-signup"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent pr-10"
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 caractères
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F2431E] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-[#F2431E] transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#F2431E] mx-auto" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
