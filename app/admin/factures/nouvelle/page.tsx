'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function NouvelleFacturePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  
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

    loadReservations();
  }, [user]);

  const handleReservationChange = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (reservation) {
      // Récupérer les infos client depuis notes si disponibles
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setIsSubmitting(true);
    try {
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
      router.push('/admin/factures');
    } catch (error: any) {
      console.error('Erreur création facture:', error);
      alert(error.message || 'Erreur lors de la création de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const texts = {
    fr: {
      title: 'Générer une facture',
      reservation: 'Réservation associée (optionnel)',
      customerEmail: 'Email du client',
      customerName: 'Nom du client',
      customerPhone: 'Téléphone',
      deliveryAddress: 'Adresse de livraison',
      subtotal: 'Sous-total (€)',
      deliveryFee: 'Frais de livraison (€)',
      depositTotal: 'Total caution (€)',
      total: 'Total (€)',
      status: 'Statut',
      submit: 'Créer la facture',
      cancel: 'Annuler',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour générer une facture.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Generate an invoice',
      reservation: 'Associated reservation (optional)',
      customerEmail: 'Client email',
      customerName: 'Client name',
      customerPhone: 'Phone',
      deliveryAddress: 'Delivery address',
      subtotal: 'Subtotal (€)',
      deliveryFee: 'Delivery fee (€)',
      depositTotal: 'Total deposit (€)',
      total: 'Total (€)',
      status: 'Status',
      submit: 'Create invoice',
      cancel: 'Cancel',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to generate an invoice.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="flex flex-1 pt-[112px] lg:flex-row">
          <div className="hidden lg:block flex-shrink-0 transition-all duration-300 w-64"></div>
          <AdminSidebar
            language={language}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
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
        </div>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          isAdmin={true}
          onSuccess={() => window.location.reload()}
          onOpenUserModal={() => router.push('/dashboard')}
        />
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
        <AdminSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
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
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.reservation}</label>
                  <select
                    value={formData.reservation_id}
                    onChange={(e) => handleReservationChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  >
                    <option value="">Aucune réservation</option>
                    {reservations.map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>
                        {reservation.id.slice(0, 8)} - {new Date(reservation.start_date).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.customerEmail}</label>
                    <input
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.customerName}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.customerPhone}</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.deliveryAddress}</label>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.subtotal}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.deliveryFee}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.depositTotal}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit_total}
                      onChange={(e) => setFormData({ ...formData, deposit_total: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.total}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.status}</label>
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

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/factures')}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {currentTexts.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Création...' : currentTexts.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

