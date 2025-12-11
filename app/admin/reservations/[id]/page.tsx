'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { PACKS } from '@/lib/packs';

export default function AdminReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const [reservation, setReservation] = useState<any>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [etatLieux, setEtatLieux] = useState<any>(null);

  useEffect(() => {
    if (!user || !supabase || !reservationId) return;

    const loadReservation = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (error) throw error;

        // Récupérer l'order associé si disponible
        let order = null;
        if (data.notes) {
          try {
            const notesData = JSON.parse(data.notes);
            if (notesData.sessionId) {
              const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq('stripe_session_id', notesData.sessionId)
                .single();
              order = orderData;
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }

        setReservation({ ...data, order });

        // Charger l'état des lieux si existant
        const { data: etatLieuxData } = await supabase
          .from('etat_lieux')
          .select('*')
          .eq('reservation_id', reservationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (etatLieuxData) {
          setEtatLieux(etatLieuxData);
        }
      } catch (error) {
        console.error('Erreur chargement réservation:', error);
        router.push('/admin/reservations');
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string, endDate?: string) => {
    const now = new Date();
    const end = endDate ? new Date(endDate) : null;
    const isPast = end && end < now;

    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: isPast ? 'Terminée' : 'Confirmée', color: isPast ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' },
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
      customer: 'Client',
      email: 'Email',
      phone: 'Téléphone',
      dates: 'Dates',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      equipment: 'Équipement',
      pack: 'Pack',
      address: 'Adresse de livraison',
      total: 'Total',
      deposit: 'Caution',
      notes: 'Notes',
      downloadContract: 'Télécharger le contrat',
      contractSigned: 'Contrat signé',
      contractNotSigned: 'Contrat non signé',
      noReservation: 'Réservation non trouvée',
      loading: 'Chargement...',
      orderInfo: 'Informations de commande',
      paymentStatus: 'Statut de paiement',
      etatLieux: 'États des lieux',
      verifierMateriel: 'Vérifier matériel',
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
      customer: 'Customer',
      email: 'Email',
      phone: 'Phone',
      dates: 'Dates',
      startDate: 'Start date',
      endDate: 'End date',
      equipment: 'Equipment',
      pack: 'Pack',
      address: 'Delivery address',
      total: 'Total',
      deposit: 'Deposit',
      notes: 'Notes',
      downloadContract: 'Download contract',
      contractSigned: 'Contract signed',
      contractNotSigned: 'Contract not signed',
      noReservation: 'Reservation not found',
      loading: 'Loading...',
      orderInfo: 'Order information',
      paymentStatus: 'Payment status',
      etatLieux: 'Condition report',
      verifierMateriel: 'Check equipment',
      etatLieuxLivraison: 'Delivery completed',
      etatLieuxReprise: 'Return completed',
      etatLieuxEnAttente: 'Pending',
      downloadEtatLieux: 'Download PDF',
    },
  };

  const currentTexts = texts[language];
  const reservationNumber = reservation?.id ? reservation.id.slice(0, 8).toUpperCase() : '';
  const isSigned = !!reservation?.client_signature;
  const statusInfo = reservation ? getStatusText(reservation.status, reservation.end_date) : { text: '', color: '' };

  // Extraire les infos client
  let customerName = 'Client';
  let customerEmail = '';
  let customerPhone = '';

  if (reservation) {
    if (reservation.notes) {
      try {
        const notesData = JSON.parse(reservation.notes);
        if (notesData.customerName) customerName = notesData.customerName;
        if (notesData.customerEmail) customerEmail = notesData.customerEmail;
        if (notesData.customerPhone) customerPhone = notesData.customerPhone;
      } catch (e) {
        // Ignorer
      }
    }
    if (reservation.order) {
      customerName = reservation.order.customer_name || customerName;
      customerEmail = reservation.order.customer_email || customerEmail;
    }
  }

  if (loading || loadingReservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Connexion requise</h1>
            <p className="text-xl text-gray-600 mb-8">Connectez-vous pour accéder à cette page.</p>
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              Se connecter
            </button>
          </div>
        </main>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          isAdmin={true}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AdminSidebar language={language} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">{currentTexts.noReservation}</p>
            <Link href="/admin/reservations" className="text-[#F2431E] hover:underline mt-4 inline-block">
              {currentTexts.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <AdminSidebar language={language} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader language={language} />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-6">
                <Link 
                  href="/admin/reservations"
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
                  reservation.status === 'confirmed' ? 'bg-green-50 border-b border-green-200' :
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
                    {isSigned && (
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
                    )}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-6">
                  {/* Informations client */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.customer}</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-gray-900 font-semibold">{customerName}</p>
                      {customerEmail && (
                        <p className="text-sm text-gray-600">{currentTexts.email}: {customerEmail}</p>
                      )}
                      {customerPhone && (
                        <p className="text-sm text-gray-600">{currentTexts.phone}: {customerPhone}</p>
                      )}
                    </div>
                  </div>

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
                        <p className="text-2xl font-bold text-[#F2431E]">
                          {reservation.total_price || reservation.order?.total || 0}€ TTC
                        </p>
                      </div>
                      {reservation.deposit && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">{currentTexts.deposit}</p>
                          <p className="text-2xl font-bold text-gray-900">{reservation.deposit}€</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations de commande */}
                  {reservation.order && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{currentTexts.orderInfo}</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-600">
                          {currentTexts.paymentStatus}: <span className="font-semibold text-gray-900">
                            {reservation.order.payment_status || 'N/A'}
                          </span>
                        </p>
                        {reservation.order.stripe_session_id && (
                          <p className="text-sm text-gray-600">
                            Session ID: <span className="font-mono text-xs">{reservation.order.stripe_session_id.slice(0, 20)}...</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contrat */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contrat</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className={`font-semibold ${isSigned ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isSigned ? currentTexts.contractSigned : currentTexts.contractNotSigned}
                      </p>
                    </div>
                  </div>

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
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600">{currentTexts.etatLieuxEnAttente}</p>
                          <Link
                            href={`/etat-materiel?reservationId=${reservationId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {currentTexts.verifierMateriel}
                          </Link>
                        </div>
                      )}
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
                </div>
              </div>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>

      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        isAdmin={true}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
