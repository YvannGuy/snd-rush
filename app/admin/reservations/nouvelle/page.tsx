'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';

export default function NouvelleReservationPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_email: '',
    customer_name: '',
    start_date: '',
    end_date: '',
    pack_id: '',
    product_id: '',
    quantity: '1',
    total_price: '',
    address: '',
    status: 'PENDING',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setIsSubmitting(true);
    try {
      // Note: userId sera null si l'utilisateur n'existe pas encore
      // L'email sera stocké dans notes pour référence
      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: null, // Sera null pour les réservations manuelles sans compte
          pack_id: formData.pack_id || null,
          product_id: formData.product_id || null,
          quantity: parseInt(formData.quantity) || 1,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          total_price: formData.total_price ? parseFloat(formData.total_price) : null,
          address: formData.address || null,
          notes: JSON.stringify({
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            manual_creation: true,
          }),
        });

      if (error) throw error;
      router.push('/admin/reservations');
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      alert(error.message || 'Erreur lors de la création de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const texts = {
    fr: {
      title: 'Nouvelle réservation',
      customerEmail: 'Email du client',
      customerName: 'Nom du client',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      packId: 'ID du pack (optionnel)',
      productId: 'ID du produit (optionnel)',
      quantity: 'Quantité',
      totalPrice: 'Prix total (€)',
      address: 'Adresse de livraison',
      status: 'Statut',
      submit: 'Créer la réservation',
      cancel: 'Annuler',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour créer une réservation.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'New reservation',
      customerEmail: 'Client email',
      customerName: 'Client name',
      startDate: 'Start date',
      endDate: 'End date',
      packId: 'Pack ID (optional)',
      productId: 'Product ID (optional)',
      quantity: 'Quantity',
      totalPrice: 'Total price (€)',
      address: 'Delivery address',
      status: 'Status',
      submit: 'Create reservation',
      cancel: 'Cancel',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to create a reservation.',
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
      <div className="min-h-screen bg-gray-50 flex">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.customerEmail}</label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.customerName}</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.startDate}</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.endDate}</label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.packId}</label>
                    <input
                      type="text"
                      value={formData.pack_id}
                      onChange={(e) => setFormData({ ...formData, pack_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.productId}</label>
                    <input
                      type="text"
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.quantity}</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.totalPrice}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_price}
                      onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.status}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.address}</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/reservations')}
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

