'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download } from 'lucide-react';

export default function AdminFacturesPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    reservation_id: '',
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    subtotal: '',
    delivery_fee: '0',
    deposit_total: '0',
    total: '',
    status: 'PAID',
  });

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!user || !supabase) return;

    const loadOrders = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        setFilteredOrders(data || []);
      } catch (error) {
        console.error('Erreur chargement factures:', error);
      }
    };

    const loadReservations = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setReservations(data || []);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
      }
    };

    loadOrders();
    loadReservations();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter((order) => {
    
  // Double vérification de sécurité
  if (!isAdmin) {
    return null;
  }

  return (
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query)
      );
    });
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchQuery, orders]);

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'REFUNDED': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Factures',
      addInvoice: '+ Générer une facture',
      searchPlaceholder: 'Rechercher une facture...',
      noInvoices: 'Aucune facture',
      customer: 'Client',
      date: 'Date',
      total: 'Total',
      status: 'Statut',
      actions: 'Actions',
      view: 'Voir',
      download: 'Télécharger',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux factures.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Invoices',
      addInvoice: '+ Generate an invoice',
      searchPlaceholder: 'Search an invoice...',
      noInvoices: 'No invoices',
      customer: 'Client',
      date: 'Date',
      total: 'Total',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access invoices.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Sauvegarder l'état de la sidebar dans localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  if (loading || checkingAdmin) {
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
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SoundRush</span>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="bg-[#F2431E] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  {currentTexts.addInvoice}
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              {paginatedOrders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-16">
                    <p className="text-gray-500 text-lg">{currentTexts.noInvoices}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedOrders.map((order) => {
                      const getStatusBadgeColor = (status: string) => {
                        const upperStatus = status.toUpperCase();
                        if (upperStatus === 'PAID' || upperStatus === 'PAYE') {
                          return { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-800' };
                        } else if (upperStatus === 'PENDING' || upperStatus === 'EN_ATTENTE') {
                          return { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' };
                        } else if (upperStatus === 'CANCELLED' || upperStatus === 'ANNULEE') {
                          return { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-800' };
                        }
                        return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-800' };
                      };
                      
                      const badgeColors = getStatusBadgeColor(order.status);
                      
                      return (
                        <Card key={order.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Badge de statut */}
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 px-3 py-1`}>
                                    <span className={`w-2 h-2 rounded-full ${badgeColors.dot} mr-2 inline-block`}></span>
                                    {order.status}
                                  </Badge>
                                </div>
                                
                                {/* Nom du client */}
                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                  {order.customer_name || 'Client'}
                                </h3>
                                
                                {/* Email */}
                                {order.customer_email && (
                                  <p className="text-sm text-gray-600 mb-3">{order.customer_email}</p>
                                )}
                                
                                {/* Date */}
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                                
                                {/* Montant */}
                                <div className="text-lg font-semibold text-gray-900 mt-3">
                                  {order.total}€
                                </div>
                              </div>
                              
                              {/* Bouton télécharger */}
                              <a
                                href={`/api/invoice/download?orderId=${order.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2 bg-[#F2431E] hover:bg-[#E63A1A] text-white rounded-lg font-semibold transition-colors flex-shrink-0"
                              >
                                {currentTexts.download}
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />

      {/* Modal générer facture */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {language === 'fr' ? 'Générer une facture' : 'Generate an invoice'}
              </h3>
              <button
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  setFormData({
                    reservation_id: '',
                    customer_email: '',
                    customer_name: '',
                    customer_phone: '',
                    delivery_address: '',
                    subtotal: '',
                    delivery_fee: '0',
                    deposit_total: '0',
                    total: '',
                    status: 'PAID',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !supabase) return;

                setIsSubmitting(true);
                try {
                  if (!supabase) return;
                  const { error } = await supabase
                    .from('orders')
                    .insert({
                      customer_email: formData.customer_email,
                      customer_name: formData.customer_name,
                      customer_phone: formData.customer_phone || null,
                      delivery_address: formData.delivery_address || null,
                      subtotal: parseFloat(formData.subtotal),
                      delivery_fee: parseFloat(formData.delivery_fee) || 0,
                      deposit_total: parseFloat(formData.deposit_total) || 0,
                      total: parseFloat(formData.total),
                      status: formData.status,
                      metadata: {
                        reservation_id: formData.reservation_id || null,
                        manual_creation: true,
                      },
                    });

                  if (error) throw error;
                  
                  // Recharger les factures
                  if (!supabase) return;
                  const { data: newOrders } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                  if (newOrders) {
                    setOrders(newOrders);
                    setFilteredOrders(newOrders);
                  }

                  setIsInvoiceModalOpen(false);
                  setFormData({
                    reservation_id: '',
                    customer_email: '',
                    customer_name: '',
                    customer_phone: '',
                    delivery_address: '',
                    subtotal: '',
                    delivery_fee: '0',
                    deposit_total: '0',
                    total: '',
                    status: 'PAID',
                  });
                } catch (error: any) {
                  console.error('Erreur création facture:', error);
                  alert(error.message || 'Erreur lors de la création de la facture');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'fr' ? 'Réservation associée (optionnel)' : 'Associated reservation (optional)'}
                </label>
                <select
                  value={formData.reservation_id}
                  onChange={(e) => {
                    const reservationId = e.target.value;
                    const reservation = reservations.find(r => r.id === reservationId);
                    if (reservation) {
                      let customerName = '';
                      let customerEmail = '';
                      if (reservation.notes) {
                        try {
                          const notesData = JSON.parse(reservation.notes);
                          customerName = notesData.customer_name || '';
                          customerEmail = notesData.customer_email || '';
                        } catch (e) {
                          // Ignorer les erreurs de parsing
                        }
                      }

                      setFormData({
                        ...formData,
                        reservation_id: reservationId,
                        total: reservation.total_price ? reservation.total_price.toString() : '',
                        subtotal: reservation.total_price ? reservation.total_price.toString() : '',
                        customer_name: customerName,
                        customer_email: customerEmail,
                        delivery_address: reservation.address || '',
                      });
                    } else {
                      setFormData({ ...formData, reservation_id: reservationId });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                >
                  <option value="">{language === 'fr' ? 'Aucune réservation' : 'No reservation'}</option>
                  {reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.id.slice(0, 8)} - {new Date(reservation.start_date).toLocaleDateString('fr-FR')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Email du client' : 'Client email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Nom du client' : 'Client name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'fr' ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'fr' ? 'Adresse de livraison' : 'Delivery address'}
                </label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Sous-total (€)' : 'Subtotal (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Frais de livraison (€)' : 'Delivery fee (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Total caution (€)' : 'Total deposit (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deposit_total}
                    onChange={(e) => setFormData({ ...formData, deposit_total: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'fr' ? 'Total (€)' : 'Total (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'fr' ? 'Statut' : 'Status'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsInvoiceModalOpen(false);
                    setFormData({
                      reservation_id: '',
                      customer_email: '',
                      customer_name: '',
                      customer_phone: '',
                      delivery_address: '',
                      subtotal: '',
                      delivery_fee: '0',
                      deposit_total: '0',
                      total: '',
                      status: 'PAID',
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting 
                    ? (language === 'fr' ? 'Création...' : 'Creating...')
                    : (language === 'fr' ? 'Créer la facture' : 'Create invoice')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

