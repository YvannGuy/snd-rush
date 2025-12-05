'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';
import { useAuth } from '@/hooks/useAuth';

export default function AdminParametresPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPacks: 0,
    totalReservations: 0,
    totalOrders: 0,
    totalClients: 0,
  });

  useEffect(() => {
    if (!user || !supabase) return;

    const loadStats = async () => {
      try {
        const [products, packs, reservations, orders] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('packs').select('*', { count: 'exact', head: true }),
          supabase.from('reservations').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('customer_email', { count: 'exact', head: true }),
        ]);

        // Compter les clients uniques
        const { data: ordersData } = await supabase
          .from('orders')
          .select('customer_email')
          .limit(1000);

        const uniqueClients = new Set(ordersData?.map(o => o.customer_email) || []);

        setStats({
          totalProducts: products.count || 0,
          totalPacks: packs.count || 0,
          totalReservations: reservations.count || 0,
          totalOrders: orders.count || 0,
          totalClients: uniqueClients.size,
        });
      } catch (error) {
        console.error('Erreur chargement statistiques:', error);
      }
    };

    loadStats();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const texts = {
    fr: {
      title: 'Paramètres',
      statistics: 'Statistiques',
      totalProducts: 'Produits',
      totalPacks: 'Packs',
      totalReservations: 'Réservations',
      totalOrders: 'Commandes',
      totalClients: 'Clients',
      account: 'Compte',
      email: 'Email',
      role: 'Rôle',
      administrator: 'Administrateur',
      signOut: 'Déconnexion',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux paramètres.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Settings',
      statistics: 'Statistics',
      totalProducts: 'Products',
      totalPacks: 'Packs',
      totalReservations: 'Reservations',
      totalOrders: 'Orders',
      totalClients: 'Clients',
      account: 'Account',
      email: 'Email',
      role: 'Role',
      administrator: 'Administrator',
      signOut: 'Sign out',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access settings.',
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
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
              {/* Statistiques */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.statistics}</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalProducts}</div>
                    <div className="text-sm text-gray-600">{currentTexts.totalProducts}</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalPacks}</div>
                    <div className="text-sm text-gray-600">{currentTexts.totalPacks}</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalReservations}</div>
                    <div className="text-sm text-gray-600">{currentTexts.totalReservations}</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalOrders}</div>
                    <div className="text-sm text-gray-600">{currentTexts.totalOrders}</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalClients}</div>
                    <div className="text-sm text-gray-600">{currentTexts.totalClients}</div>
                  </div>
                </div>
              </div>

              {/* Compte */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.account}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.email}</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.role}</label>
                    <input
                      type="text"
                      value={currentTexts.administrator}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSignOut}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      {currentTexts.signOut}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

