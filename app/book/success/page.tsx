'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Calendar, MapPin, Package, ArrowRight, Mail, Phone } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';

function BookSuccessContent() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservation_id');
  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useUser();

  const texts = {
    fr: {
      title: 'Paiement réussi ! 🎉',
      subtitle: 'Votre réservation est confirmée',
      processing: 'Traitement de votre paiement...',
      loading: 'Chargement de vos informations...',
      reservationDetails: 'Détails de votre réservation',
      pack: 'Pack',
      dates: 'Dates',
      location: 'Lieu',
      total: 'Montant total',
      deposit: 'Acompte payé (30%)',
      balance: 'Solde restant (70%)',
      balanceDue: 'Solde à payer J-5',
      depositDue: 'Caution à payer J-2',
      nextSteps: 'Prochaines étapes',
      nextStepsDesc: 'Vous recevrez un email de confirmation avec tous les détails. Le solde restant sera demandé 5 jours avant votre événement.',
      createAccount: 'Créer un compte',
      createAccountDesc: 'Créez un compte pour suivre votre réservation, accéder à vos documents et gérer vos paiements.',
      alreadyHaveAccount: 'Vous avez déjà un compte ?',
      signIn: 'Se connecter',
      viewDashboard: 'Voir mon dashboard',
      backHome: 'Retour à l\'accueil',
      contactUs: 'Une question ?',
      contactDesc: 'Notre équipe est là pour vous aider.',
      phone: '07 44 78 27 54',
      email: 'contact@guylocationevents.com',
    },
    en: {
      title: 'Payment successful! 🎉',
      subtitle: 'Your reservation is confirmed',
      processing: 'Processing your payment...',
      loading: 'Loading your information...',
      reservationDetails: 'Reservation details',
      pack: 'Pack',
      dates: 'Dates',
      location: 'Location',
      total: 'Total amount',
      deposit: 'Deposit paid (30%)',
      balance: 'Remaining balance (70%)',
      balanceDue: 'Balance due J-5',
      depositDue: 'Security deposit due J-2',
      nextSteps: 'Next steps',
      nextStepsDesc: 'You will receive a confirmation email with all the details. The remaining balance will be requested 5 days before your event.',
      createAccount: 'Create an account',
      createAccountDesc: 'Create an account to track your reservation, access your documents and manage your payments.',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign in',
      viewDashboard: 'View my dashboard',
      backHome: 'Back to home',
      contactUs: 'Have a question?',
      contactDesc: 'Our team is here to help you.',
      phone: '07 44 78 27 54',
      email: 'contact@guylocationevents.com',
    },
  };

  const currentTexts = texts[language];

  // Fonction pour rafraîchir manuellement le statut
  const refreshReservationStatus = async () => {
    if (!reservationId) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/reservations/public/${reservationId}`);
      const data = await response.json();
      
      if (response.ok && data) {
        setReservation(data);
        const status = data.status?.toUpperCase();
        if (status === 'AWAITING_BALANCE' || status === 'PAID' || status === 'CONFIRMED') {
          console.log('✅ Statut mis à jour:', status);
        }
      }
    } catch (error) {
      console.error('❌ Erreur rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const packNames: Record<string, string> = {
    conference: language === 'fr' ? 'Pack Conférence' : 'Conference Pack',
    soiree: language === 'fr' ? 'Pack Soirée' : 'Party Pack',
    mariage: language === 'fr' ? 'Pack Mariage' : 'Wedding Pack',
  };

  // Récupérer les données de la réservation et vérifier le statut
  useEffect(() => {
    if (!reservationId) {
      console.error('❌ ID de réservation manquant dans l\'URL');
      setIsLoading(false);
      setIsCheckingStatus(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 5; // Réduit à 5 tentatives (environ 5 secondes max)
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchReservation = async () => {
      try {
        attempts++;
        console.log(`🔄 Tentative ${attempts}/${maxAttempts} - Récupération réservation ${reservationId}`);

        const response = await fetch(`/api/reservations/public/${reservationId}`);
        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error || data.details || 'Erreur inconnue';
          console.error('❌ Erreur récupération réservation:', errorMsg);
          if (attempts >= maxAttempts) {
            setIsLoading(false);
            setIsCheckingStatus(false);
            // Afficher les données même si le statut n'est pas encore mis à jour
            // Le webhook peut prendre quelques secondes
            if (data && data.id) {
              setReservation(data);
            } else {
              setReservation(null);
            }
          }
          return;
        }

        if (data) {
          setReservation(data);

          // Si le statut est AWAITING_BALANCE ou supérieur, le webhook a traité le paiement
          const status = data.status?.toUpperCase();
          if (status === 'AWAITING_BALANCE' || status === 'PAID' || status === 'CONFIRMED') {
            console.log('✅ Paiement confirmé, statut:', status);
            setIsCheckingStatus(false);
            setIsLoading(false);
            return;
          }

          // Si encore AWAITING_PAYMENT après plusieurs tentatives, afficher quand même
          // Le webhook peut prendre quelques secondes, mais on affiche les données disponibles
          if (attempts >= maxAttempts) {
            console.warn('⚠️ Statut toujours AWAITING_PAYMENT après 5 tentatives');
            console.warn('⚠️ Cela peut signifier que le webhook Stripe n\'a pas encore été traité');
            console.warn('⚠️ Le paiement peut être en cours de traitement, vérifiez votre email de confirmation');
            setIsCheckingStatus(false);
            setIsLoading(false);
          } else {
            // Si le statut est toujours AWAITING_PAYMENT après plusieurs tentatives,
            // essayer de vérifier manuellement la session Stripe (utile en développement)
            if (attempts >= 3 && data.stripe_session_id) {
              console.log('[SUCCESS] Tentative vérification manuelle session Stripe:', data.stripe_session_id);
              try {
                const verifyResponse = await fetch('/api/payments/verify-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: data.stripe_session_id,
                    reservation_id: reservationId,
                  }),
                });
                
                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json();
                  if (verifyData.success && verifyData.status === 'PAID') {
                    console.log('[SUCCESS] ✅ Paiement confirmé via vérification manuelle');
                    setReservation({ ...data, status: 'PAID' });
                    setIsCheckingStatus(false);
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (verifyError) {
                console.warn('[SUCCESS] ⚠️ Erreur vérification manuelle:', verifyError);
              }
            }
            
            // Réessayer dans 1 seconde (au lieu de 2)
            timeoutId = setTimeout(fetchReservation, 1000);
          }
        }
      } catch (error) {
        console.error('❌ Erreur récupération réservation:', error);
        if (attempts >= maxAttempts) {
          setIsLoading(false);
          setIsCheckingStatus(false);
          // Essayer d'afficher les données si disponibles
          try {
            const fallbackResponse = await fetch(`/api/reservations/public/${reservationId}`);
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.id) {
              setReservation(fallbackData);
            }
          } catch (e) {
            // Ignorer l'erreur de fallback
          }
        } else {
          timeoutId = setTimeout(fetchReservation, 1000);
        }
      }
    };

    // Démarrer la récupération immédiatement
    fetchReservation();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [reservationId]);

  // Formatage des dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-[112px] min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">
              {isCheckingStatus ? currentTexts.processing : currentTexts.loading}
            </p>
          </div>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-[112px] min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <Alert className="mb-6">
              <AlertDescription>
                {!reservationId
                  ? (language === 'fr'
                      ? 'ID de réservation manquant dans l\'URL. Veuillez vérifier le lien reçu par email ou contacter le support.'
                      : 'Reservation ID missing in URL. Please check the link received by email or contact support.')
                  : (language === 'fr'
                      ? 'Réservation non trouvée. Veuillez contacter le support.'
                      : 'Reservation not found. Please contact support.')}
              </AlertDescription>
            </Alert>
            <Link href="/">
              <Button>{currentTexts.backHome}</Button>
            </Link>
          </div>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  const packName = packNames[reservation.pack_key] || reservation.pack_key;
  const depositAmount = parseFloat(reservation.deposit_amount?.toString() || '0');
  const balanceAmount = parseFloat(reservation.balance_amount?.toString() || '0');
  const totalAmount = parseFloat(reservation.price_total?.toString() || '0');
  const isStillAwaitingPayment = reservation.status?.toUpperCase() === 'AWAITING_PAYMENT';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[112px] pb-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Message de succès */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentTexts.title}</h1>
            <p className="text-xl text-gray-600">{currentTexts.subtitle}</p>
            {isStillAwaitingPayment && (
              <Alert className="mt-4 max-w-2xl mx-auto">
                <AlertDescription className="space-y-3">
                  <p>
                    {language === 'fr' 
                      ? '⚠️ Votre paiement est en cours de traitement. Vous recevrez un email de confirmation sous peu. Si vous ne recevez pas d\'email dans les prochaines minutes, veuillez contacter le support.'
                      : '⚠️ Your payment is being processed. You will receive a confirmation email shortly. If you do not receive an email within the next few minutes, please contact support.'}
                  </p>
                  <Button
                    onClick={refreshReservationStatus}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'fr' ? 'Vérification...' : 'Checking...'}
                      </>
                    ) : (
                      <>
                        {language === 'fr' ? '🔄 Vérifier à nouveau le statut' : '🔄 Check status again'}
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Détails de la réservation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {currentTexts.reservationDetails}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{currentTexts.pack}</p>
                  <p className="font-semibold text-gray-900">{packName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{currentTexts.total}</p>
                  <p className="font-semibold text-gray-900">{totalAmount.toFixed(2)}€</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {currentTexts.dates}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(reservation.start_at)} à {formatTime(reservation.start_at)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {language === 'fr' ? 'Jusqu\'au' : 'Until'} {formatDate(reservation.end_at)} à {formatTime(reservation.end_at)}
                  </p>
                </div>
                {reservation.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {currentTexts.location}
                    </p>
                    <p className="font-semibold text-gray-900">{reservation.address}</p>
                  </div>
                )}
              </div>

              {/* Récapitulatif financier */}
              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentTexts.deposit}</span>
                    <span className="font-semibold text-green-600">{depositAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentTexts.balance}</span>
                    <span className="font-semibold text-gray-900">{balanceAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">{currentTexts.total}</span>
                    <span className="font-bold text-lg text-gray-900">{totalAmount.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prochaines étapes */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{currentTexts.nextSteps}</CardTitle>
              <CardDescription>{currentTexts.nextStepsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    {language === 'fr'
                      ? 'Email de confirmation envoyé à ' + (reservation.customer_email || 'votre adresse email')
                      : 'Confirmation email sent to ' + (reservation.customer_email || 'your email address')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    {currentTexts.balanceDue}: {balanceAmount.toFixed(2)}€
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    {currentTexts.depositDue}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Créer un compte ou se connecter */}
          {!user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{currentTexts.createAccount}</CardTitle>
                <CardDescription>{currentTexts.createAccountDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setIsSignModalOpen(true)}
                  className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                  size="lg"
                >
                  {currentTexts.createAccount}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{currentTexts.alreadyHaveAccount}</p>
                  <Button
                    onClick={() => setIsSignModalOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    {currentTexts.signIn}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Si connecté, bouton vers dashboard */}
          {user && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Link href="/dashboard">
                  <Button className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white" size="lg">
                    {currentTexts.viewDashboard}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{currentTexts.contactUs}</CardTitle>
              <CardDescription>{currentTexts.contactDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href={`tel:${currentTexts.phone}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-[#F2431E] transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>{currentTexts.phone}</span>
                </a>
                <a
                  href={`mailto:${currentTexts.email}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-[#F2431E] transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>{currentTexts.email}</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Bouton retour accueil */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button variant="outline" size="lg">
                {currentTexts.backHome}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Modal de connexion/inscription */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => {
          setIsSignModalOpen(false);
          // Rediriger vers le dashboard après connexion
          router.push('/dashboard');
        }}
        onOpenAdminModal={() => {}}
      />

      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <BookSuccessContent />
    </Suspense>
  );
}

