'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface SignModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillEmail?: string;
  onSuccess?: () => void;
  language?: 'fr' | 'en';
  initialTab?: 'signin' | 'signup';
  isAdmin?: boolean;
  onOpenAdminModal?: () => void;
  onOpenUserModal?: () => void;
}

type TabType = 'signin' | 'signup';

export default function SignModal({ 
  isOpen, 
  onClose, 
  prefillEmail = '', 
  onSuccess,
  language = 'fr',
  initialTab = 'signin',
  isAdmin = false,
  onOpenAdminModal,
  onOpenUserModal
}: SignModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Réinitialiser l'onglet quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Pour admin, forcer l'onglet signin
      if (isAdmin) {
        setActiveTab('signin');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, isAdmin]);
  const [title, setTitle] = useState<'mr' | 'mme'>('mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { signInWithEmail, signUpWithEmail, loading, error } = useAuth();

  useEffect(() => {
    setEmail(prefillEmail);
  }, [prefillEmail]);

  if (!isOpen) return null;

  const texts = {
    fr: {
      signIn: 'Se connecter',
      signUp: 'Créer un compte',
      email: 'Email',
      password: 'Mot de passe',
      needHelp: 'Besoin d\'aide ?',
      call: 'Appeler',
      whatsapp: 'WhatsApp',
      whyAccount: 'Pourquoi créer un compte ?',
      benefits: [
        'Suivez vos réservations',
        'Accédez à vos factures',
      ],
      close: 'Fermer',
      title: 'Titre',
      mr: 'Monsieur',
      mme: 'Madame',
      firstName: 'Prénom',
      lastName: 'Nom',
      phone: 'Téléphone',
    },
    en: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      email: 'Email',
      password: 'Password',
      needHelp: 'Need help?',
      call: 'Call',
      whatsapp: 'WhatsApp',
      whyAccount: 'Why create an account?',
      benefits: [
        'Track your reservations',
        'Access your invoices',
      ],
      close: 'Close',
      title: 'Title',
      mr: 'Mr',
      mme: 'Mrs',
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone',
    },
  };

  const currentTexts = texts[language];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signInWithEmail(email, password);
    if (!result.error) {
      onSuccess?.();
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!firstName || !lastName || !phone) {
      return;
    }
    
    const result = await signUpWithEmail(email, password, {
      title,
      firstName,
      lastName,
      phone,
    });
    
    if (!result.error) {
      setSignUpSuccess(true);
      // Ne pas fermer immédiatement pour afficher le message
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-black">
            {isAdmin 
              ? (language === 'fr' ? 'Administrateur' : 'Administrator')
              : (activeTab === 'signin' ? currentTexts.signIn : currentTexts.signUp)
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={currentTexts.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs - masqués pour admin */}
          {!isAdmin && (
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('signin');
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'signin'
                    ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentTexts.signIn}
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'signup'
                    ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentTexts.signUp}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Sign up success message */}
          {signUpSuccess && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <div className="font-semibold mb-2">
                {language === 'fr' ? '✅ Compte créé avec succès !' : '✅ Account created successfully!'}
              </div>
              <p className="mb-2">
                {language === 'fr' 
                  ? 'Nous vous avons envoyé un email de confirmation. Veuillez vérifier votre boîte de réception (et vos spams) et cliquer sur le lien pour valider votre compte.'
                  : 'We have sent you a confirmation email. Please check your inbox (and spam folder) and click the link to validate your account.'}
              </p>
              <button
                onClick={() => {
                  setSignUpSuccess(false);
                  onSuccess?.();
                  onClose();
                }}
                className="mt-2 w-full bg-[#F2431E] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
              >
                {language === 'fr' ? 'Compris' : 'Got it'}
              </button>
            </div>
          )}


          {/* Forms */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.email}
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.password}
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F2431E] text-white rounded-xl font-bold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : currentTexts.signIn}
              </button>
            </form>
          )}

          {/* Lien administrateur - visible uniquement sur l'onglet connexion utilisateur */}
          {activeTab === 'signin' && !isAdmin && onOpenAdminModal && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminModal();
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F2431E] transition-colors group"
              >
                <span>{language === 'fr' ? 'Administrateur' : 'Administrator'}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Lien utilisateur - visible uniquement sur le modal admin */}
          {activeTab === 'signin' && isAdmin && onOpenUserModal && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenUserModal();
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F2431E] transition-colors group"
              >
                <span>{language === 'fr' ? 'Utilisateur' : 'User'}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'signup' && !isAdmin && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-title" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.title}
                </label>
                <select
                  id="signup-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value as 'mr' | 'mme')}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none bg-white"
                >
                  <option value="mr">{currentTexts.mr}</option>
                  <option value="mme">{currentTexts.mme}</option>
                </select>
              </div>
              <div>
                <label htmlFor="signup-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.firstName}
                </label>
                <input
                  id="signup-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder={language === 'fr' ? 'Votre prénom' : 'Your first name'}
                />
              </div>
              <div>
                <label htmlFor="signup-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.lastName}
                </label>
                <input
                  id="signup-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder={language === 'fr' ? 'Votre nom' : 'Your last name'}
                />
              </div>
              <div>
                <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.phone}
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder={language === 'fr' ? '06 12 34 56 78' : '+33 6 12 34 56 78'}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.email}
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.password}
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
              </div>
              <button
                type="submit"
                disabled={loading || !firstName || !lastName || !phone}
                className="w-full py-3 bg-[#F2431E] text-white rounded-xl font-bold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : currentTexts.signUp}
              </button>
            </form>
          )}


          {/* Why account section - masquée pour admin */}
          {!isAdmin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-black mb-2">{currentTexts.whyAccount}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {currentTexts.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-[#F2431E]">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avertissement sécurité - visible uniquement sur le modal admin */}
          {isAdmin && activeTab === 'signin' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                {language === 'fr' 
                  ? '⚠️ Toute tentative de connexion non autorisée sera enregistrée'
                  : '⚠️ Any unauthorized login attempt will be recorded'}
              </p>
            </div>
          )}

          {/* Help section - masquée pour admin */}
          {!isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">{currentTexts.needHelp}</p>
              <div className="flex gap-4 justify-center">
                <a
                  href="tel:+33123456789"
                  className="text-[#F2431E] font-semibold hover:underline"
                >
                  {currentTexts.call}
                </a>
                <a
                  href="https://wa.me/33123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F2431E] font-semibold hover:underline"
                >
                  {currentTexts.whatsapp}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

