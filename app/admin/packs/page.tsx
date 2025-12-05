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

export default function AdminPacksPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [packs, setPacks] = useState<any[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!user || !supabase) return;

    const loadPacks = async () => {
      try {
        const { data, error } = await supabase
          .from('packs')
          .select('*')
          .order('prix_base_ttc', { ascending: true });

        if (error) throw error;
        setPacks(data || []);
        setFilteredPacks(data || []);
      } catch (error) {
        console.error('Erreur chargement packs:', error);
      }
    };

    loadPacks();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPacks(packs);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = packs.filter((pack) => {
      return pack.nom_pack?.toLowerCase().includes(query);
    });
    setFilteredPacks(filtered);
    setCurrentPage(1);
  }, [searchQuery, packs]);

  const paginatedPacks = filteredPacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPacks.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Packs',
      addPack: '+ Créer un pack',
      searchPlaceholder: 'Rechercher un pack...',
      noPacks: 'Aucun pack',
      name: 'Nom',
      price: 'Prix',
      actions: 'Actions',
      edit: 'Modifier',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder aux packs.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Packs',
      addPack: '+ Create a pack',
      searchPlaceholder: 'Search a pack...',
      noPacks: 'No packs',
      name: 'Name',
      price: 'Price',
      actions: 'Actions',
      edit: 'Edit',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access packs.',
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
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
                <Link
                  href="/admin/packs/nouveau"
                  className="bg-[#F2431E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
                >
                  {currentTexts.addPack}
                </Link>
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

              {paginatedPacks.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noPacks}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {filteredPacks.length} {filteredPacks.length === 1 ? 'pack' : 'packs'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPacks.map((pack) => (
                    <div key={pack.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{pack.nom_pack}</h3>
                      <div className="mb-4">
                        <div className="text-sm text-gray-500">{currentTexts.price}</div>
                        <div className="text-2xl font-bold text-[#F2431E]">{pack.prix_base_ttc}€</div>
                      </div>
                      <Link
                        href={`/admin/packs/${pack.id}`}
                        className="block w-full text-center bg-[#F2431E] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                      >
                        {currentTexts.edit}
                      </Link>
                    </div>
                  ))}
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

