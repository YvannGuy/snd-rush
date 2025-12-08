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

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientEmail = params?.email ? decodeURIComponent(params.email as string) : '';
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !supabase || !clientEmail) return;

    const loadClientData = async () => {
      try {
        // Charger les commandes du client
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', clientEmail)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Charger les réservations du client
        // Les réservations peuvent avoir l'email dans notes (JSON) ou être liées via orders
        const { data: allReservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        // Filtrer les réservations qui correspondent à ce client
        let reservationsData: any[] = [];
        if (allReservations) {
          // Récupérer les sessionIds des orders de ce client
          const sessionIds = (ordersData || []).map((o: any) => o.stripe_session_id).filter(Boolean);
          
          reservationsData = allReservations.filter((reservation: any) => {
            // Vérifier si la réservation a un sessionId qui correspond à un order de ce client
            if (reservation.notes) {
              try {
                const notesData = JSON.parse(reservation.notes);
                if (notesData.sessionId && sessionIds.includes(notesData.sessionId)) {
                  return true;
                }
                if (notesData.customerEmail && notesData.customerEmail.toLowerCase() === clientEmail.toLowerCase()) {
                  return true;
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
            return false;
          });
        }

        if (reservationsError) {
          console.error('Erreur chargement réservations:', reservationsError);
        }

        // Extraire les infos client depuis la première commande
        if (ordersData && ordersData.length > 0) {
          const firstOrder = ordersData[0];
          const totalSpent = ordersData.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
          
          setClient({
            email: clientEmail,
            name: firstOrder.customer_name || 'Client',
            phone: firstOrder.customer_phone || '',
            totalSpent,
            ordersCount: ordersData.length,
            reservationsCount: reservationsData?.length || 0,
            firstOrder: ordersData[ordersData.length - 1]?.created_at,
            lastOrder: ordersData[0]?.created_at,
          });
        } else {
          // Si pas de commandes, essayer de trouver dans les réservations
          if (reservationsData && reservationsData.length > 0) {
            const firstReservation = reservationsData[0];
            let clientName = 'Client';
            let clientPhone = '';
            
            if (firstReservation.notes) {
              try {
                const notesData = JSON.parse(firstReservation.notes);
                clientName = notesData.customerName || clientName;
                clientPhone = notesData.customerPhone || clientPhone;
              } catch (e) {
                // Ignorer
              }
            }
            
            setClient({
              email: clientEmail,
              name: clientName,
              phone: clientPhone,
              totalSpent: 0,
              ordersCount: 0,
              reservationsCount: reservationsData.length,
              firstOrder: null,
              lastOrder: null,
            });
          } else {
            setClient({
              email: clientEmail,
              name: 'Client',
              phone: '',
              totalSpent: 0,
              ordersCount: 0,
              reservationsCount: 0,
              firstOrder: null,
              lastOrder: null,
            });
          }
        }

        setOrders(ordersData || []);
        setReservations(reservationsData || []);
      } catch (error) {
        console.error('Erreur chargement données client:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadClientData();
  }, [user, clientEmail]);

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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Confirmée', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Annulée', color: 'bg-red-100 text-red-800' },
      completed: { text: 'Terminée', color: 'bg-blue-100 text-blue-800' },
      paid: { text: 'Payée', color: 'bg-green-100 text-green-800' },
      unpaid: { text: 'Non payée', color: 'bg-yellow-100 text-yellow-800' },
    };
    return statusMap[status?.toLowerCase()] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const texts = {
    fr: {
      title: 'Détails du client',
      back: 'Retour aux clients',
      clientInfo: 'Informations client',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      statistics: 'Statistiques',
      totalSpent: 'Total dépensé',
      ordersCount: 'Nombre de commandes',
      reservationsCount: 'Nombre de réservations',
      orders: 'Commandes',
      reservations: 'Réservations',
      date: 'Date',
      amount: 'Montant',
      status: 'Statut',
      view: 'Voir',
      noOrders: 'Aucune commande',
      noReservations: 'Aucune réservation',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux détails du client.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Client Details',
      back: 'Back to clients',
      clientInfo: 'Client Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      statistics: 'Statistics',
      totalSpent: 'Total spent',
      ordersCount: 'Number of orders',
      reservationsCount: 'Number of reservations',
      orders: 'Orders',
      reservations: 'Reservations',
      date: 'Date',
      amount: 'Amount',
      status: 'Status',
      view: 'View',
      noOrders: 'No orders',
      noReservations: 'No reservations',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access client details.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading || loadingData) {
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
        />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AdminSidebar language={language} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">Client non trouvé</p>
            <Link href="/admin/clients" className="text-[#F2431E] hover:underline mt-4 inline-block">
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
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-6">
                <Link 
                  href="/admin/clients"
                  className="text-[#F2431E] hover:text-[#E63A1A] font-semibold mb-4 inline-block"
                >
                  ← {currentTexts.back}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
              </div>

              {/* Informations client */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{currentTexts.clientInfo}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{currentTexts.name}</p>
                      <p className="text-lg font-semibold text-gray-900">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{currentTexts.email}</p>
                      <p className="text-lg font-semibold text-gray-900">{client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{currentTexts.phone}</p>
                      <p className="text-lg font-semibold text-gray-900">{client.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">{currentTexts.totalSpent}</p>
                  <p className="text-3xl font-bold text-[#F2431E]">{client.totalSpent.toLocaleString('fr-FR')}€</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">{currentTexts.ordersCount}</p>
                  <p className="text-3xl font-bold text-gray-900">{client.ordersCount}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">{currentTexts.reservationsCount}</p>
                  <p className="text-3xl font-bold text-gray-900">{client.reservationsCount}</p>
                </div>
              </div>

              {/* Commandes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{currentTexts.orders}</h2>
                </div>
                <div className="overflow-x-auto">
                  {orders.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">{currentTexts.noOrders}</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.date}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.amount}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.status}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => {
                          const statusInfo = getStatusText(order.payment_status || order.status);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {parseFloat(order.total || 0).toLocaleString('fr-FR')}€
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  href={`/admin/reservations/${order.id}`}
                                  className="text-[#F2431E] hover:text-[#E63A1A]"
                                >
                                  {currentTexts.view}
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Réservations */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{currentTexts.reservations}</h2>
                </div>
                <div className="overflow-x-auto">
                  {reservations.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">{currentTexts.noReservations}</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.date}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.amount}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.status}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentTexts.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reservations.map((reservation) => {
                          const statusInfo = getStatusText(reservation.status);
                          return (
                            <tr key={reservation.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(reservation.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {parseFloat(reservation.total_price || 0).toLocaleString('fr-FR')}€
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
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
                          );
                        })}
                      </tbody>
                    </table>
                  )}
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
