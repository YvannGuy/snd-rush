'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MesReservationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadReservations = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        const { data, error } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
        setFilteredReservations(data || []);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadReservations();
  }, [user]);

  // Filtrer les réservations selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReservations(reservations);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reservations.filter((reservation) => {
      const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
      const startDate = new Date(reservation.start_date).toLocaleDateString('fr-FR');
      const endDate = new Date(reservation.end_date).toLocaleDateString('fr-FR');
      const totalPrice = parseFloat(reservation.total_price || 0).toFixed(2);
      const status = getStatusText(reservation.status.toLowerCase(), language).toLowerCase();
      const address = (reservation.address || '').toLowerCase();

      return (
        reservationNumber.toLowerCase().includes(query) ||
        startDate.includes(query) ||
        endDate.includes(query) ||
        totalPrice.includes(query) ||
        status.includes(query) ||
        address.includes(query)
      );
    });

    setFilteredReservations(filtered);
    setCurrentPage(1);
  }, [searchQuery, reservations, language]);

  // Fonction pour obtenir le nom d'un pack
  const getPackName = (packId: string | null, lang: 'fr' | 'en' = 'fr') => {
    if (!packId) return null;
    const packNames: { [key: string]: { fr: string; en: string } } = {
      '1': { fr: 'Essentiel', en: 'Essential' },
      '2': { fr: 'Standard', en: 'Standard' },
      '3': { fr: 'Premium', en: 'Premium' },
      '4': { fr: 'Événement', en: 'Event' },
      'pack-1': { fr: 'Essentiel', en: 'Essential' },
      'pack-2': { fr: 'Standard', en: 'Standard' },
      'pack-3': { fr: 'Premium', en: 'Premium' },
      'pack-4': { fr: 'Événement', en: 'Event' },
    };
    return packNames[packId]?.[lang] || `Pack ${packId}`;
  };

  // Formater une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Obtenir le statut traduit
  const getStatusText = (status: string, lang: 'fr' | 'en') => {
    const statusMap: { [key: string]: { fr: string; en: string } } = {
      'confirmed': { fr: 'Confirmée', en: 'Confirmed' },
      'pending': { fr: 'En attente', en: 'Pending' },
      'cancelled': { fr: 'Annulée', en: 'Cancelled' },
      'completed': { fr: 'Terminée', en: 'Completed' },
    };
    return statusMap[status]?.[lang] || status;
  };

  const texts = {
    fr: {
      title: 'Mes réservations',
      empty: 'Aucune réservation',
      emptyDescription: 'Vous n\'avez pas encore de réservations.',
      explorePacks: 'Voir les packs',
      status: 'Statut',
      dates: 'Dates',
      total: 'Total',
      deposit: 'Dépôt de garantie',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour voir vos réservations.',
      signIn: 'Se connecter',
      downloadContract: 'Télécharger le contrat',
      signContract: 'Signer le contrat',
      contractSigned: 'Contrat signé',
      viewDetails: 'Voir les détails',
      reservationNumber: 'Réservation',
      from: 'Du',
      to: 'au',
      address: 'Adresse',
      notes: 'Notes',
      noAddress: 'Non spécifiée',
      noNotes: 'Aucune note',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
    },
    en: {
      title: 'My reservations',
      empty: 'No reservations',
      emptyDescription: 'You don\'t have any reservations yet.',
      explorePacks: 'View packs',
      status: 'Status',
      dates: 'Dates',
      total: 'Total',
      deposit: 'Deposit',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to view your reservations.',
      signIn: 'Sign in',
      downloadContract: 'Download contract',
      signContract: 'Sign contract',
      contractSigned: 'Contract signed',
      viewDetails: 'View details',
      reservationNumber: 'Reservation',
      from: 'From',
      to: 'to',
      address: 'Address',
      notes: 'Notes',
      noAddress: 'Not specified',
      noNotes: 'No notes',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.signInRequired}</h1>
            <p className="text-xl text-gray-600 mb-8">{currentTexts.signInDescription}</p>
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.signIn}
            </button>
          </div>
        </main>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex lg:flex-row">
      <DashboardSidebar language={language} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

          {/* Barre de recherche */}
          {reservations.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher par date, prix, numéro, statut, adresse...' : 'Search by date, price, number, status, address...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  {language === 'fr' 
                    ? `${filteredReservations.length} réservation${filteredReservations.length > 1 ? 's' : ''} trouvée${filteredReservations.length > 1 ? 's' : ''}`
                    : `${filteredReservations.length} reservation${filteredReservations.length > 1 ? 's' : ''} found`}
                </p>
              )}
            </div>
          )}

          {filteredReservations.length === 0 && reservations.length > 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <p className="text-xl text-gray-600 mb-2">{language === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}</p>
              <p className="text-gray-500 mb-8">{language === 'fr' ? 'Essayez avec d\'autres mots-clés' : 'Try with different keywords'}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {language === 'fr' ? 'Effacer la recherche' : 'Clear search'}
              </button>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📅</div>
              <p className="text-xl text-gray-600 mb-2">{currentTexts.empty}</p>
              <p className="text-gray-500 mb-8">{currentTexts.emptyDescription}</p>
              <Link
                href="/packs"
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.explorePacks}
              </Link>
            </div>
          ) : (
            <>
              {(() => {
                const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedReservations = filteredReservations.slice(startIndex, endIndex);
                
                return (
                  <>
                    <div className="space-y-6 mb-6">
                      {paginatedReservations.map((reservation) => {
                const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
                const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'CONFIRMED';
                const isPending = reservation.status === 'pending' || reservation.status === 'PENDING';
                const isSigned = !!reservation.client_signature;
                
                return (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Header avec statut */}
                    <div className={`px-4 sm:px-6 py-4 ${
                      isConfirmed ? 'bg-green-50 border-b border-green-200' :
                      isPending ? 'bg-yellow-50 border-b border-yellow-200' :
                      'bg-gray-50 border-b border-gray-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isConfirmed ? 'bg-green-100' :
                            isPending ? 'bg-yellow-100' :
                            'bg-gray-100'
                          }`}>
                            <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              isConfirmed ? 'text-green-600' :
                              isPending ? 'text-yellow-600' :
                              'text-gray-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              {currentTexts.reservationNumber} #{reservationNumber}
                            </h3>
                            <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                              isConfirmed
                                ? 'bg-green-100 text-green-800'
                                : isPending
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusText(reservation.status.toLowerCase(), language)}
                            </span>
                          </div>
                        </div>
                        {isConfirmed && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            {!isSigned ? (
                              <Link
                                href={`/sign-contract?reservationId=${reservation.id}`}
                                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="hidden sm:inline">{currentTexts.signContract}</span>
                                <span className="sm:hidden">Signer</span>
                              </Link>
                            ) : (
                              <span className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden sm:inline">{currentTexts.contractSigned}</span>
                                <span className="sm:hidden">Signé</span>
                              </span>
                            )}
                            <a
                              href={`/api/contract/download?reservationId=${reservation.id}`}
                              download={`contrat-${reservationNumber}.pdf`}
                              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span className="hidden sm:inline">{currentTexts.downloadContract}</span>
                              <span className="sm:hidden">PDF</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Informations principales */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.dates}</h4>
                            <div className="flex items-center gap-2 text-gray-900">
                              <svg className="w-5 h-5 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">{formatDate(reservation.start_date)}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium">{formatDate(reservation.end_date)}</span>
                            </div>
                          </div>

                          {reservation.address && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.address}</h4>
                              <p className="text-gray-900">{reservation.address}</p>
                            </div>
                          )}

                          {/* Produits réservés */}
                          {(() => {
                            // Extraire les cartItems depuis les notes
                            let cartItems: any[] = [];
                            
                            if (reservation.notes) {
                              try {
                                const parsedNotes = JSON.parse(reservation.notes);
                                if (parsedNotes && parsedNotes.cartItems && Array.isArray(parsedNotes.cartItems)) {
                                  cartItems = parsedNotes.cartItems;
                                }
                              } catch (e) {
                                // Ce n'est pas du JSON ou pas de cartItems
                              }
                            }
                            
                            if (cartItems.length > 0) {
                              return (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 mb-3">{language === 'fr' ? 'Produits réservés' : 'Reserved products'}</h4>
                                  <div className="space-y-2">
                                    {cartItems.map((item: any, index: number) => {
                                      const dailyPrice = parseFloat(item.dailyPrice || 0);
                                      const quantity = parseInt(item.quantity || 1);
                                      const rentalDays = parseInt(item.rentalDays || 1);
                                      const itemTotal = dailyPrice * quantity * rentalDays;
                                      
                                      return (
                                        <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                              <p className="font-semibold text-gray-900 text-sm">{item.productName || 'Produit'}</p>
                                              {item.addons && item.addons.length > 0 && (
                                                <div className="mt-1 space-y-1">
                                                  {item.addons.map((addon: any, addonIndex: number) => (
                                                    <p key={addonIndex} className="text-xs text-gray-600">
                                                      + {addon.name} (+{addon.price}€)
                                                    </p>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <p className="font-bold text-[#F2431E] text-sm ml-2">{itemTotal.toFixed(2)}€</p>
                                          </div>
                                          <div className="flex gap-4 text-xs text-gray-600">
                                            <span>Qté: {quantity}</span>
                                            <span>Prix/jour: {dailyPrice.toFixed(2)}€</span>
                                            <span>Durée: {rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Si pas de cartItems, afficher les notes normales si elles existent
                            let notesContent = reservation.notes;
                            if (notesContent) {
                              try {
                                const parsedNotes = JSON.parse(notesContent);
                                // Ne pas afficher si ce sont uniquement des métadonnées techniques
                                if (parsedNotes && typeof parsedNotes === 'object') {
                                  if (parsedNotes.cartItems || parsedNotes.sessionId) {
                                    // Si c'est juste des métadonnées (pas de message/notes), ne rien afficher
                                    if (!parsedNotes.message && !parsedNotes.notes) {
                                      notesContent = null;
                                    } else {
                                      // Afficher seulement message ou notes, pas les métadonnées
                                      notesContent = parsedNotes.message || parsedNotes.notes || null;
                                    }
                                  } else {
                                    // Pas de métadonnées techniques, afficher les autres champs
                                    notesContent = Object.entries(parsedNotes)
                                      .filter(([key]) => key !== 'sessionId')
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(', ') || null;
                                  }
                                }
                              } catch (e) {
                                // Ce n'est pas du JSON, afficher tel quel
                              }
                            }
                            
                            return notesContent ? (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.notes}</h4>
                                <p className="text-gray-700 text-sm">{notesContent}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {/* Informations financières */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-500 mb-3">Informations financières</h4>
                            <div className="space-y-2">
                              {reservation.total_price && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{currentTexts.total}</span>
                                  <span className="text-lg font-bold text-gray-900">{parseFloat(reservation.total_price).toFixed(2)}€</span>
                                </div>
                              )}
                              {reservation.deposit_amount && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{currentTexts.deposit}</span>
                                  <span className="font-semibold text-gray-900">{parseFloat(reservation.deposit_amount).toFixed(2)}€</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {reservation.pack_id && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">Pack réservé</h4>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold">♪</span>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  Pack {getPackName(reservation.pack_id, language)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                    </div>

                    {/* Pagination */}
                    {(() => {
                      const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
                      return totalPages > 1 ? (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            {currentTexts.page} {currentPage} {currentTexts.of} {totalPages}
                          </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {currentTexts.previous}
                          </button>
                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {currentTexts.next}
                          </button>
                        </div>
                      </div>
                      ) : null;
                    })()}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

