
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SolutionsSection from '@/components/SolutionsSection';
import UrgencySection from '@/components/UrgencySection';
import PromiseSection from '@/components/PromiseSection';
import RecentEventsSection from '@/components/RecentEventsSection';
// import GallerySection from '@/components/GallerySection'; // Masqué
import TrustedBySection from '@/components/TrustedBySection';
import TrustindexReviews from '@/components/TrustindexReviews';
import Footer from '@/components/Footer';
import SectionAnimation from '@/components/SectionAnimation';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import SplashScreen from '@/components/SplashScreen';
import ContactFormSection from '@/components/ContactFormSection';
import BookingWizard from '@/components/BookingWizard';
import SEOHead from '@/components/SEOHead';

type HomeLocale = 'fr' | 'en' | 'it' | 'es' | 'zh';

export default function HomePageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);
  const [showContent, setShowContent] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPackKey, setWizardPackKey] = useState<'conference' | 'soiree' | 'mariage' | null>(null);
  const [homeLocale, setHomeLocale] = useState<HomeLocale>('fr');
  const localizedLanguage = homeLocale as any;

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportedLocales: HomeLocale[] = ['fr', 'en', 'it', 'es', 'zh'];
    const storedLocale = localStorage.getItem('preferredLocale') as HomeLocale | null;
    const detectBrowserLocale = (): HomeLocale => {
      const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

      for (const lang of browserLanguages) {
        const normalized = (lang || '').toLowerCase();
        if (normalized.startsWith('zh')) return 'zh';
        if (normalized.startsWith('it')) return 'it';
        if (normalized.startsWith('es')) return 'es';
        if (normalized.startsWith('en')) return 'en';
        if (normalized.startsWith('fr')) return 'fr';
      }

      return 'fr';
    };

    if (storedLocale && supportedLocales.includes(storedLocale)) {
      setHomeLocale(storedLocale);
    } else {
      const detectedLocale = detectBrowserLocale();
      localStorage.setItem('preferredLocale', detectedLocale);
      window.dispatchEvent(new CustomEvent('preferredLocaleChanged', { detail: { locale: detectedLocale } }));
      setHomeLocale(detectedLocale);
      setLanguage(detectedLocale === 'fr' ? 'fr' : 'en');
    }

    const handlePreferredLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: HomeLocale }>;
      const nextLocale = customEvent.detail?.locale;
      if (nextLocale && supportedLocales.includes(nextLocale)) {
        setHomeLocale(nextLocale);
      }
    };

    window.addEventListener('preferredLocaleChanged', handlePreferredLocaleChange as EventListener);
    return () => {
      window.removeEventListener('preferredLocaleChanged', handlePreferredLocaleChange as EventListener);
    };
  }, [language]);

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
    
    // Écouter l'événement pour ouvrir le wizard de réservation
    const handleOpenBookingWizard = (event: CustomEvent) => {
      const { packKey } = event.detail;
      if (packKey && ['conference', 'soiree', 'mariage'].includes(packKey)) {
        setWizardPackKey(packKey as 'conference' | 'soiree' | 'mariage');
        setWizardOpen(true);
      }
    };
    window.addEventListener('openBookingWizard', handleOpenBookingWizard as EventListener);
    
    return () => {
      window.removeEventListener('openReservationModal', handleOpenReservationModal as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
      window.removeEventListener('openBookingWizard', handleOpenBookingWizard as EventListener);
    };
  }, []);

  return (
    <>
      {/* Splash Screen - affiché en premier, bloque le rendu */}
      <SplashScreen onComplete={() => setShowContent(true)} />
      
      {/* Contenu principal - affiché seulement après le splash */}
      {showContent && (
        <div className="min-h-screen bg-white">
          <SEOHead
            title={language === 'fr' 
              ? 'Location Sono Urgence 24/7 Paris | SoundRush - Packs Clé en Main'
              : '24/7 Sound Rental Paris | SoundRush - Turnkey Packs'}
            description={language === 'fr'
              ? 'SoundRush Paris : location sono urgence 24h/24 et 7j/7 à Paris et Île-de-France. Sonorisation professionnelle, packs clé en main pour mariages, anniversaires, événements corporate. Livraison incluse, installation disponible.'
              : 'SoundRush Paris: 24/7 emergency sound rental in Paris and Île-de-France. Professional sound systems, turnkey packs for weddings, birthdays, corporate events. Delivery included, installation available.'}
            canonicalUrl="https://www.sndrush.com"
            keywords={language === 'fr' ? [
              'location sono urgence Paris',
              'sono urgence 24/7 Paris',
              'location sonorisation express Paris',
              'sono mariage Paris',
              'location sono professionnelle Paris',
              'packs sono clé en main Paris',
              'location matériel audio Île-de-France',
            ] : [
              'emergency sound rental Paris',
              '24/7 sound rental Paris',
              'express sound system rental Paris',
              'wedding sound system Paris',
              'professional sound rental Paris',
              'turnkey sound packs Paris',
              'audio equipment rental Île-de-France',
            ]}
          />
          <Header 
            language={language} 
            onLanguageChange={setLanguage}
          />
      
      <main>
        <HeroSection 
          language={localizedLanguage}
        />

        {/* Section IA - Masquée */}
        {/* <SectionAnimation delay={0.05}>
          <IASection language={language} />
        </SectionAnimation> */}

        {/* Section Nos Solutions */}
        <SectionAnimation delay={0.1}>
          <SolutionsSection 
            language={localizedLanguage}
          />
        </SectionAnimation>

        {/* Section Promise */}
        <SectionAnimation delay={0.3}>
          <PromiseSection language={localizedLanguage} />
        </SectionAnimation>

        {/* Section Pourquoi SoundRush - Masquée */}
        {/* <SectionAnimation delay={0.4}>
          <AboutSection language={localizedLanguage} />
        </SectionAnimation> */}

        {/* Section Galerie Vidéos - Masquée */}
        {/* <SectionAnimation delay={0.45}>
          <GallerySection language={language} />
        </SectionAnimation> */}

        {/* Section Ils nous ont fait confiance */}
        <SectionAnimation delay={0.48}>
          <TrustedBySection language={localizedLanguage} />
        </SectionAnimation>

        {/* Section Témoignages Clients */}
        <SectionAnimation delay={0.5}>
          <TrustindexReviews language={localizedLanguage} />
        </SectionAnimation>

        {/* Section Besoin d'une sono maintenant ? */}
        <SectionAnimation delay={0.52}>
          <UrgencySection language={localizedLanguage} />
        </SectionAnimation>

        {/* Section Nos récents événements */}
        <SectionAnimation delay={0.55}>
          <RecentEventsSection language={localizedLanguage} />
        </SectionAnimation>

        {/* Section Contact */}
        <SectionAnimation delay={0.6}>
          <ContactFormSection language={localizedLanguage} />
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
          
          {/* Wizard de réservation guidée */}
          {wizardPackKey && (
            <BookingWizard
              isOpen={wizardOpen}
              onClose={() => {
                setWizardOpen(false);
                setWizardPackKey(null);
              }}
              packKey={wizardPackKey}
              language={language}
            />
          )}
        </div>
      )}
    </>
  );
}
