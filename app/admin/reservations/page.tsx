'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';

export default function AdminReservationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || !supabase) return;

    const loadReservations = async () => {
      try {
        // Charger toutes les réservations avec les informations utilisateur
        const { data: reservationsData, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Récupérer tous les orders pour enrichir les réservations
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        // Enrichir avec les informations des orders
        const enrichedReservations = (reservationsData || []).map((reservation) => {
          let customerName = 'Client';
          let customerEmail = '';
          let order = null;

          // Chercher l'order associé via sessionId dans notes
          if (reservation.notes) {
            try {
              const notesData = JSON.parse(reservation.notes);
              if (notesData.sessionId && allOrders) {
                order = allOrders.find((o: any) => o.stripe_session_id === notesData.sessionId);
              }
              // Utiliser les infos du notes si disponibles
              if (notesData.customerName) customerName = notesData.customerName;
              if (notesData.customerEmail) customerEmail = notesData.customerEmail;
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }

          // Si on a trouvé un order, utiliser ses infos
          if (order) {
            customerName = order.customer_name || customerName;
            customerEmail = order.customer_email || customerEmail;
          }

          return {
            ...reservation,
            customerName,
            customerEmail,
            order,
          };
        });

        setReservations(enrichedReservations);
        setFilteredReservations(enrichedReservations);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadReservations();
  }, [user]);

  // Filtrer les réservations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReservations(reservations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reservations.filter((reservation) => {
      return (
        reservation.customerName?.toLowerCase().includes(query) ||
        reservation.customerEmail?.toLowerCase().includes(query) ||
        reservation.id.toLowerCase().includes(query) ||
        reservation.status?.toLowerCase().includes(query) ||
        reservation.address?.toLowerCase().includes(query)
      );
    });
    setFilteredReservations(filtered);
    setCurrentPage(1);
  }, [searchQuery, reservations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'CONFIRMED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPackName = (packId: string | null) => {
    if (!packId) return 'Réservation';
    const packNames: { [key: string]: string } = {
      'pack-1': 'Pack Essentiel',
      'pack-2': 'Pack Standard',
      'pack-3': 'Pack Premium',
      'pack-4': 'Pack Événement',
    };
    return packNames[packId] || `Pack ${packId}`;
  };

  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Réservations',
      searchPlaceholder: 'Rechercher par client, email, statut...',
      noResults: 'Aucune réservation trouvée',
      customer: 'Client',
      dates: 'Dates',
      status: 'Statut',
      total: 'Total',
      actions: 'Actions',
      view: 'Voir',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux réservations.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Reservations',
      searchPlaceholder: 'Search by client, email, status...',
      noResults: 'No reservations found',
      customer: 'Client',
      dates: 'Dates',
      status: 'Status',
      total: 'Total',
      actions: 'Actions',
      view: 'View',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access reservations.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
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
          isAdmin={true}
          onSuccess={() => window.location.reload()}
          onOpenUserModal={() => router.push('/dashboard')}
        />
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
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentTexts.title}</h1>
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder={currentTexts.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {filteredReservations.length} {filteredReservations.length === 1 ? 'réservation' : 'réservations'}
                </p>
              </div>

              {paginatedReservations.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noResults}</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {currentTexts.customer}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {currentTexts.dates}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {currentTexts.status}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {currentTexts.total}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {currentTexts.actions}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedReservations.map((reservation) => (
                            <tr key={reservation.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {reservation.customerName || 'Client'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {reservation.customerEmail || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                  {reservation.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {reservation.total_price ? `${reservation.total_price}€` : reservation.order?.total ? `${reservation.order.total}€` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  href={`/admin/reservations/${reservation.id}`}
                                  className="text-[#F2431E] hover:text-[#E63A1A]"
                                >
                                  {currentTexts.view}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

