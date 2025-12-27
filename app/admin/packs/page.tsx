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

export default function AdminPacksPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [packs, setPacks] = useState<any[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!user) return;

    // Utiliser les packs de la homepage (même source que PacksSection et SolutionsSection)
    // Ces packs correspondent à ceux affichés sur la homepage
    const homepagePacks = [
      // Packs de PacksSection
      { id: 1, nom_pack: 'Pack S Petit', prix_base_ttc: 109, description_courte: 'Solution basique pour petits événements' },
      { id: 2, nom_pack: 'Pack M Confort', prix_base_ttc: 129, description_courte: 'Solution complète pour événements moyens' },
      { id: 3, nom_pack: 'Pack L Grand', prix_base_ttc: 179, description_courte: 'Solution professionnelle pour grands événements' },
      { id: 5, nom_pack: 'Pack XL Maxi / Sur mesure', prix_base_ttc: null, description_courte: 'Solution sur mesure pour très grands événements' },
      // Packs de SolutionsSection (clé en main)
      { id: 101, nom_pack: 'Pack Conférence', prix_base_ttc: 279, description_courte: 'Pour réunions, conférences, prises de parole, cultes et événements institutionnels. Solution clé en main.' },
      { id: 102, nom_pack: 'Pack Soirée', prix_base_ttc: 329, description_courte: 'Pour soirées privées, anniversaires et événements festifs. Solution clé en main.' },
      { id: 103, nom_pack: 'Pack Mariage', prix_base_ttc: 449, description_courte: 'Pour mariages, soirées DJ et événements à fort enjeu. Solution clé en main.' }
    ];

    // Optionnellement, enrichir avec les données de Supabase si disponibles
    if (supabase) {
      const loadPacksFromSupabase = async () => {
        if (!supabase) return;
        try {
          const { data, error } = await supabase
            .from('packs')
            .select('*')
            .order('prix_base_ttc', { ascending: true });

          if (!error && data && data.length > 0) {
            // Fusionner les packs de Supabase avec ceux de la homepage
            // En gardant les packs de la homepage comme base et en mettant à jour avec Supabase si l'ID correspond
            const mergedPacks = homepagePacks.map(homePack => {
              const supabasePack = data.find((sp: any) => sp.id === homePack.id);
              if (supabasePack) {
                return {
                  ...homePack,
                  nom_pack: supabasePack.nom_pack || homePack.nom_pack,
                  prix_base_ttc: supabasePack.prix_base_ttc !== null && supabasePack.prix_base_ttc !== undefined 
                    ? supabasePack.prix_base_ttc 
                    : homePack.prix_base_ttc,
                  description_courte: supabasePack.description_courte || homePack.description_courte
                };
              }
              return homePack;
            });
            setPacks(mergedPacks);
            setFilteredPacks(mergedPacks);
          } else {
            setPacks(homepagePacks);
            setFilteredPacks(homepagePacks);
          }
        } catch (error) {
          console.error('Erreur chargement packs Supabase:', error);
          setPacks(homepagePacks);
          setFilteredPacks(homepagePacks);
        }
      };

      loadPacksFromSupabase();
    } else {
      setPacks(homepagePacks);
      setFilteredPacks(homepagePacks);
    }
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
      <div className="flex flex-1 lg:flex-row">
        {/* Sidebar - Fixed, ne prend pas d'espace dans le flux */}
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

          {/* Header Desktop */}
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
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
                      {pack.description_courte && (
                        <p className="text-sm text-gray-600 mb-4">{pack.description_courte}</p>
                      )}
                      <div className="mb-4">
                        <div className="text-sm text-gray-500">{currentTexts.price}</div>
                        <div className="text-2xl font-bold text-[#F2431E]">
                          {pack.prix_base_ttc ? `${pack.prix_base_ttc}€` : 'Sur devis'}
                        </div>
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
      <Footer language={language} />
    </div>
  );
}

