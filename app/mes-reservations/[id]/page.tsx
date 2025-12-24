'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PACKS } from '@/lib/packs';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const [reservation, setReservation] = useState<any>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [etatLieux, setEtatLieux] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !supabase || !reservationId) return;

    const loadReservation = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setReservation(data);

        // Charger l'état des lieux si existant
        const { data: etatLieuxData, error: etatLieuxError } = await supabase
          .from('etat_lieux')
          .select('*')
          .eq('reservation_id', reservationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (etatLieuxError) {
          console.error('Erreur chargement état des lieux:', etatLieuxError);
        } else if (etatLieuxData) {
          setEtatLieux(etatLieuxData);
        }
      } catch (error) {
        console.error('Erreur chargement réservation:', error);
        router.push('/mes-reservations');
      } finally {
        setLoadingReservation(false);
      }
    };

    loadReservation();
  }, [user, reservationId, router]);

  const getPackName = (packId: number) => {
    const pack = Object.values(PACKS).find(p => {
      if (packId === 1) return p.id === 'pack_petit';
      if (packId === 2) return p.id === 'pack_confort';
      if (packId === 3) return p.id === 'pack_grand';
      if (packId === 4) return p.id === 'pack_maxi';
      return false;
    });
    return pack?.name || `Pack ${packId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Confirmée', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Annulée', color: 'bg-red-100 text-red-800' },
      completed: { text: 'Terminée', color: 'bg-blue-100 text-blue-800' },
    };
    return statusMap[status?.toLowerCase()] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const texts = {
    fr: {
      title: 'Détails de la réservation',
      back: 'Retour aux réservations',
      reservationNumber: 'Réservation',
      status: 'Statut',
      dates: 'Dates',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      equipment: 'Équipement',
      pack: 'Pack',
      address: 'Adresse de livraison',
      total: 'Total',
      deposit: 'Caution',
      notes: 'Notes',
      signContract: 'Signer le contrat',
      downloadContract: 'Télécharger le contrat',
      contractSigned: 'Contrat signé',
      noReservation: 'Réservation non trouvée',
      loading: 'Chargement...',
      etatLieux: 'États des lieux',
      etatLieuxLivraison: 'Livraison effectuée',
      etatLieuxReprise: 'Reprise effectuée',
      etatLieuxEnAttente: 'En attente',
      downloadEtatLieux: 'Télécharger le PDF',
    },
    en: {
      title: 'Reservation Details',
      back: 'Back to reservations',
      reservationNumber: 'Reservation',
      status: 'Status',
      dates: 'Dates',
      startDate: 'Start date',
      endDate: 'End date',
      equipment: 'Equipment',
      pack: 'Pack',
      address: 'Delivery address',
      total: 'Total',
      deposit: 'Deposit',
      notes: 'Notes',
      signContract: 'Sign contract',
      downloadContract: 'Download contract',
      contractSigned: 'Contract signed',
      noReservation: 'Reservation not found',
      loading: 'Loading...',
      etatLieux: 'Condition report',
      etatLieuxLivraison: 'Delivery completed',
      etatLieuxReprise: 'Return completed',
      etatLieuxEnAttente: 'Pending',
      downloadEtatLieux: 'Download PDF',
    },
  };

  const currentTexts = texts[language];
  const reservationNumber = reservation?.id ? reservation.id.slice(0, 8).toUpperCase() : '';
  const isConfirmed = reservation?.status === 'confirmed' || reservation?.status === 'CONFIRMED';
  const isSigned = !!reservation?.client_signature;
  const statusInfo = reservation ? getStatusText(reservation.status) : { text: '', color: '' };

  if (loading || loadingReservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">{currentTexts.noReservation}</p>
            <Link href="/mes-reservations" className="text-[#F2431E] hover:underline mt-4 inline-block">
              {currentTexts.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <DashboardSidebar language={language} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href="/mes-reservations"
              className="text-[#F2431E] hover:text-[#E63A1A] font-semibold mb-4 inline-block"
            >
              ← {currentTexts.back}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
          </div>

          {/* Card principale */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header avec statut */}
            <div className={`px-6 py-5 ${
              isConfirmed ? 'bg-green-50 border-b border-green-200' :
              reservation.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-200' :
              'bg-gray-50 border-b border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentTexts.reservationNumber} #{reservationNumber}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
                {isConfirmed && (
                  <div className="flex gap-2">
                    {!isSigned ? (
                      <Link
                        href={`/sign-contract?reservationId=${reservation.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {currentTexts.signContract}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {currentTexts.contractSigned}
                      </span>
                    )}
                    <a
                      href={`/api/contract/download?reservationId=${reservation.id}`}
                      download={`contrat-${reservationNumber}.pdf`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {currentTexts.downloadContract}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.dates}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{currentTexts.startDate}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(reservation.start_date)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{currentTexts.endDate}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(reservation.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Équipement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.equipment}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-900">
                    {reservation.pack_id 
                      ? `${currentTexts.pack}: ${getPackName(reservation.pack_id)}`
                      : reservation.product_id 
                      ? `Produit #${reservation.product_id}`
                      : 'Équipement personnalisé'}
                  </p>
                  {reservation.quantity && (
                    <p className="text-sm text-gray-600 mt-2">Quantité: {reservation.quantity}</p>
                  )}
                </div>
              </div>

              {/* Adresse */}
              {reservation.address && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.address}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{reservation.address}</p>
                  </div>
                </div>
              )}

              {/* Prix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations financières</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{currentTexts.total}</p>
                    <p className="text-2xl font-bold text-[#F2431E]">{reservation.total_price || 0}€ TTC</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{currentTexts.deposit}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reservation.deposit_amount || reservation.deposit || 0}€
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {reservation.notes && (() => {
                let displayNotes = null;
                if (typeof reservation.notes === 'string') {
                  try {
                    const notesData = JSON.parse(reservation.notes);
                    // Ne pas afficher si ce sont uniquement des métadonnées techniques
                    if (notesData.sessionId || notesData.cartItems) {
                      // Si c'est juste des métadonnées, ne rien afficher
                      if (!notesData.message && !notesData.notes) {
                        displayNotes = null;
                      } else {
                        displayNotes = notesData.message || notesData.notes;
                      }
                    } else {
                      displayNotes = notesData.message || notesData.notes || reservation.notes;
                    }
                  } catch {
                    displayNotes = reservation.notes;
                  }
                } else {
                  displayNotes = reservation.notes;
                }
                
                return displayNotes ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.notes}</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{displayNotes}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* États des lieux */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.etatLieux}</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {etatLieux ? (
                    <div className="space-y-4">
                      {/* Rapport de LIVRAISON */}
                      {etatLieux.signature_avant && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {currentTexts.etatLieuxLivraison}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(etatLieux.created_at)}
                              </p>
                            </div>
                            <a
                              href={`/api/etat-lieux/download?reservationId=${reservationId}&type=livraison`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {currentTexts.downloadEtatLieux}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* Rapport de RÉCUPÉRATION */}
                      {etatLieux.signature_apres && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {currentTexts.etatLieuxReprise}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(etatLieux.updated_at || etatLieux.created_at)}
                              </p>
                            </div>
                            <a
                              href={`/api/etat-lieux/download?reservationId=${reservationId}&type=reprise`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {currentTexts.downloadEtatLieux}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">{currentTexts.etatLieuxEnAttente}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />

      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => router.push('/dashboard')}
      />
    </div>
  );
}
