'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { usePro } from '@/hooks/usePro';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import RequestProAccess from '@/components/pro/RequestProAccess';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Lock, CheckCircle2, Clock } from 'lucide-react';

export default function ProPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isPro, proStatus, checkingPro } = usePro();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const denied = searchParams.get('denied') === '1';

  const texts = {
    fr: {
      title: 'Espace Pro',
      subtitle: 'Accès au catalogue réservé aux utilisateurs autonomes',
      description: 'Cet espace est destiné aux DJs, techniciens son et prestataires événementiels disposant des compétences nécessaires pour installer, configurer et exploiter le matériel en toute autonomie.',
      warning: 'Aucune assistance technique n\'est fournie dans cet espace.',
      whoIsThisForTitle: 'Cet espace est fait pour vous si :',
      whoIsThisForItems: [
        'Vous savez installer et régler une sonorisation',
        'Vous êtes autonome le jour de l\'événement',
        'Vous êtes responsable du matériel loué',
        'Vous n\'avez pas besoin d\'accompagnement technique',
      ],
      otherwiseText: 'Sinon, nos solutions clé en main sont plus adaptées à votre besoin.',
      solutionsLink: 'Solutions',
      secondaryText: 'L\'accès au catalogue professionnel est soumis à validation afin de garantir une utilisation conforme du matériel et une qualité de service optimale.',
      ctaSignIn: 'Se connecter',
      ctaRequestAccess: 'Demander l\'accès Pro',
      ctaAccessCatalogue: 'Accéder au catalogue',
      reservedAccess: 'Accès réservé aux professionnels actifs',
      pendingAccess: 'Demande en attente',
      pendingDescription: 'Votre demande d\'accès Pro est en cours de traitement. Vous serez notifié dès que votre compte sera activé.',
      blockedAccess: 'Accès bloqué',
      blockedDescription: 'Votre accès Pro a été bloqué. Contactez le support pour plus d\'informations.',
      deniedMessage: 'Vous n\'avez pas accès à cette page. Demandez votre accès Pro ci-dessous.',
    },
    en: {
      title: 'Pro Space',
      subtitle: 'Catalog access reserved for autonomous users',
      description: 'This space is intended for DJs, sound technicians and event service providers with the necessary skills to install, configure and operate equipment completely independently.',
      warning: 'No technical assistance is provided in this space.',
      whoIsThisForTitle: 'This space is for you if:',
      whoIsThisForItems: [
        'You know how to install and adjust a sound system',
        'You are autonomous on the day of the event',
        'You are responsible for the rented equipment',
        'You do not need technical support',
      ],
      otherwiseText: 'Otherwise, our turnkey solutions are more suitable for your needs.',
      solutionsLink: 'Solutions',
      secondaryText: 'Access to the professional catalog is subject to validation to ensure proper use of equipment and optimal service quality.',
      ctaSignIn: 'Sign in',
      ctaRequestAccess: 'Request Pro Access',
      ctaAccessCatalogue: 'Access catalog',
      reservedAccess: 'Access reserved for active professionals',
      pendingAccess: 'Request Pending',
      pendingDescription: 'Your Pro access request is being processed. You will be notified as soon as your account is activated.',
      blockedAccess: 'Access Blocked',
      blockedDescription: 'Your Pro access has been blocked. Contact support for more information.',
      deniedMessage: 'You do not have access to this page. Request your Pro access below.',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingPro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="flex-1 pt-[112px] pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F2431E] rounded-full mb-6">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {currentTexts.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6 font-semibold">
              {currentTexts.subtitle}
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-gray-700 text-lg">
                {currentTexts.description}
              </p>
              <p className="text-red-600 font-semibold text-lg">
                {currentTexts.warning}
              </p>
            </div>
          </div>

          {/* Encadré clair */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg mb-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {currentTexts.whoIsThisForTitle}
            </h3>
            <ul className="space-y-3 mb-6">
              {currentTexts.whoIsThisForItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-500 text-xl flex-shrink-0 mt-0.5">✔️</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-600">
              {currentTexts.otherwiseText}{' '}
              <Link 
                href="/#solutions" 
                className="text-[#F2431E] hover:underline font-medium"
              >
                👉 {currentTexts.solutionsLink}
              </Link>
            </p>
          </div>

          {/* Texte secondaire */}
          <div className="mb-12">
            <p className="text-gray-600 text-center max-w-2xl mx-auto">
              {currentTexts.secondaryText}
            </p>
          </div>

          {/* Content based on user status */}
          {!user ? (
            // Non connecté
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg">
              <div className="text-center mb-8">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔒 {currentTexts.reservedAccess}
                </h2>
              </div>
              <div className="text-center">
                <Button
                  onClick={() => setIsSignModalOpen(true)}
                  className="bg-[#F2431E] text-white px-8 py-6 text-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                >
                  {currentTexts.ctaSignIn}
                </Button>
              </div>
            </div>
          ) : isPro ? (
            // Pro actif
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Accès Pro Actif
              </h2>
              <p className="text-gray-600 mb-8">
                Bienvenue dans votre espace professionnel. Accédez au catalogue complet avec vos tarifs préférentiels.
              </p>
              <Link href="/pro/catalogue">
                <Button className="bg-[#F2431E] text-white px-8 py-6 text-lg font-semibold hover:bg-[#E63A1A] transition-colors">
                  {currentTexts.ctaAccessCatalogue}
                </Button>
              </Link>
            </div>
          ) : proStatus === 'pending' ? (
            // En attente
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg text-center">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentTexts.pendingAccess}
              </h2>
              <p className="text-gray-600 mb-8">
                {currentTexts.pendingDescription}
              </p>
            </div>
          ) : proStatus === 'blocked' ? (
            // Bloqué
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg text-center">
              <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentTexts.blockedAccess}
              </h2>
              <p className="text-gray-600 mb-8">
                {currentTexts.blockedDescription}
              </p>
            </div>
          ) : (
            // Pas pro - afficher demande d'accès
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg">
              {denied && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{currentTexts.deniedMessage}</p>
                </div>
              )}
              <div className="text-center mb-8">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔒 {currentTexts.reservedAccess}
                </h2>
              </div>
              <RequestProAccess
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                language={language}
                onSuccess={() => {
                  setIsRequestModalOpen(false);
                  // Recharger pour voir le statut "pending"
                  window.location.reload();
                }}
              />
              <div className="text-center">
                <Button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="bg-[#F2431E] text-white px-8 py-6 text-lg font-semibold hover:bg-[#E63A1A] transition-colors flex items-center gap-2 mx-auto"
                >
                  <span>👉</span>
                  {currentTexts.ctaRequestAccess}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer language={language} />

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => {
          setIsSignModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
