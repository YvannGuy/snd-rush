
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SolutionsSection from '@/components/SolutionsSection';
import UrgencySection from '@/components/UrgencySection';
import PourQuiSection from '@/components/PourQuiSection';
import AboutSection from '@/components/AboutSection';
import GallerySection from '@/components/GallerySection';
import TrustedBySection from '@/components/TrustedBySection';
import TrustindexReviews from '@/components/TrustindexReviews';
import TutosSection from '@/components/TutosSection';
import Footer from '@/components/Footer';
import SectionAnimation from '@/components/SectionAnimation';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import CookieBanner from '@/components/CookieBanner';
import SplashScreen from '@/components/SplashScreen';
import ScenarioFAQSection from '@/components/ScenarioFAQSection';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);
  const [showContent, setShowContent] = useState(false);

  const handleReservePack = (packId: number) => {
    setSelectedPackId(packId);
    setReservationModal(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModal(false);
    setSelectedPackId(undefined);
  };

  // Gérer les tokens d'authentification dans le hash (#access_token=...)
  useEffect(() => {
    const handleAuthTokens = async () => {
      if (!supabase || typeof window === 'undefined') return;

      // Vérifier s'il y a des tokens dans le hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Si c'est une confirmation d'inscription ou connexion avec tokens
      if (accessToken && refreshToken && (type === 'signup' || type === 'recovery')) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Erreur lors de la création de la session:', error);
            
            // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
            if (error.message?.includes('oauth_client_id')) {
              console.warn('⚠️ Erreur oauth_client_id détectée, redirection vers le dashboard...');
              // Nettoyer le hash de l'URL
              window.history.replaceState(null, '', window.location.pathname);
              // Rediriger vers le dashboard - la session peut quand même fonctionner
              router.push('/dashboard');
              return;
            }
            return;
          }

          if (data.session) {
            console.log('✅ Session créée avec succès');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Si c'est une réinitialisation de mot de passe, rediriger vers la page de réinitialisation
            if (type === 'recovery') {
              router.push('/reinitialiser-mot-de-passe');
            } else {
              // Sinon, rediriger vers le dashboard
              router.push('/dashboard');
            }
          }
        } catch (err: any) {
          console.error('Erreur lors du traitement des tokens:', err);
          
          // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
          if (err?.message?.includes('oauth_client_id')) {
            console.warn('⚠️ Erreur oauth_client_id détectée dans catch, redirection vers le dashboard...');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Rediriger vers le dashboard
            router.push('/dashboard');
          }
        }
      }
    };

    handleAuthTokens();
  }, [router]);

  // Écouter l'événement de réservation depuis l'assistant
  useEffect(() => {
    const handleOpenReservationModal = (event: CustomEvent) => {
      const { packId, message } = event.detail;
      setSelectedPackId(packId);
      setReservationModal(true);
      
      // Préremplir le message après ouverture du modal
      setTimeout(() => {
        const messageField = document.querySelector('textarea[name*="message"], textarea[name*="comment"]') as HTMLTextAreaElement;
        if (messageField) {
          messageField.value = message;
          messageField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);
    };

    window.addEventListener('openReservationModal', handleOpenReservationModal as EventListener);
    
    // Rediriger openAssistantModal vers la chatbox flottante
    const handleOpenAssistantToChat = () => {
      window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
    };
    window.addEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    
    return () => {
      window.removeEventListener('openReservationModal', handleOpenReservationModal as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    };
  }, []);

  return (
    <>
      {/* Splash Screen - affiché en premier, bloque le rendu */}
      <SplashScreen onComplete={() => setShowContent(true)} />
      
      {/* Contenu principal - affiché seulement après le splash */}
      {showContent && (
        <div className="min-h-screen bg-white">
          <Header 
            language={language} 
            onLanguageChange={setLanguage}
          />
      
      <main className="pt-[112px]">
        <HeroSection 
          language={language}
        />

        {/* Section Nos Solutions */}
        <SectionAnimation delay={0.1}>
          <SolutionsSection 
            language={language}
            onReservePack={handleReservePack}
          />
        </SectionAnimation>

        {/* Section Besoin d'une sono maintenant ? */}
        <SectionAnimation delay={0.2}>
          <UrgencySection language={language} />
        </SectionAnimation>

        {/* Section Pour Qui ? */}
        <SectionAnimation delay={0.3}>
          <PourQuiSection language={language} />
        </SectionAnimation>

        {/* Section Pourquoi SoundRush */}
        <SectionAnimation delay={0.4}>
          <AboutSection language={language} />
        </SectionAnimation>

        {/* Section Galerie Vidéos */}
        <SectionAnimation delay={0.45}>
          <GallerySection language={language} />
        </SectionAnimation>

        {/* Section Ils nous ont fait confiance */}
        <SectionAnimation delay={0.48}>
          <TrustedBySection language={language} />
        </SectionAnimation>

        {/* Section Témoignages Clients */}
        <SectionAnimation delay={0.5}>
          <TrustindexReviews />
        </SectionAnimation>

        {/* Section Tutos */}
        <SectionAnimation delay={0.55}>
          <TutosSection language={language} />
        </SectionAnimation>

        {/* Section FAQ Scénarios */}
        <SectionAnimation delay={0.58}>
          <ScenarioFAQSection 
            language={language}
            onScenarioClick={(scenarioId) => {
              // Ouvrir l'assistant avec le scénario sélectionné
              window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
                detail: { message: scenarioId } 
              }));
            }}
          />
        </SectionAnimation>

      </main>

          <Footer 
            language={language} 
            onLegalNoticeClick={() => setLegalNoticeModal(true)}
            onRentalConditionsClick={() => setRentalConditionsModal(true)}
          />

          {/* Modals */}
          <ReservationModal 
            isOpen={reservationModal} 
            onClose={handleCloseReservationModal}
            language={language}
            preselectedPackId={selectedPackId}
          />
          
          <LegalNoticeModal 
            isOpen={legalNoticeModal} 
            onClose={() => setLegalNoticeModal(false)}
            language={language}
          />
          
          <RentalConditionsModal 
            isOpen={rentalConditionsModal} 
            onClose={() => setRentalConditionsModal(false)}
            language={language}
          />
        </div>
      )}
    </>
  );
}
