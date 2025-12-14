'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/hooks/useUser';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Icônes lucide-react
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  Music
} from 'lucide-react';
import { PACKS } from '@/lib/packs';

export default function MesContratsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Marquer les contrats comme consultés quand la page est visitée
  useEffect(() => {
    if (!user || !supabase || typeof window === 'undefined') return;
    
    const markAsViewed = async () => {
      try {
        // Marquer TOUS les contrats (signés ou non) comme consultés
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', user.id);
        
        if (reservationsData && reservationsData.length > 0) {
          const viewedIds = reservationsData.map(r => r.id);
          localStorage.setItem('viewed_contracts', JSON.stringify(viewedIds));
          // Dispatcher un événement pour mettre à jour les compteurs du dashboard
          window.dispatchEvent(new CustomEvent('pendingActionsUpdated'));
        }
      } catch (error) {
        console.error('Erreur marquage contrats comme consultés:', error);
      }
    };
    
    markAsViewed();
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadContracts = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Récupérer uniquement les réservations signées
        const { data, error } = await supabaseClient
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .not('client_signature', 'is', null)
          .order('client_signed_at', { ascending: false });

        if (error) throw error;
        setContracts(data || []);
        setFilteredContracts(data || []);
      } catch (error) {
        console.error('Erreur chargement contrats:', error);
      }
    };

    loadContracts();
  }, [user]);

  // Filtrer les contrats selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContracts(contracts);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contracts.filter((contract) => {
      const reservationNumber = contract.id.slice(0, 8).toUpperCase();
      const startDate = new Date(contract.start_date).toLocaleDateString('fr-FR');
      const endDate = new Date(contract.end_date).toLocaleDateString('fr-FR');
      const signedDate = contract.client_signed_at ? new Date(contract.client_signed_at).toLocaleDateString('fr-FR') : '';
      const totalPrice = parseFloat(contract.total_price || 0).toFixed(2);
      const address = (contract.address || '').toLowerCase();

      return (
        reservationNumber.toLowerCase().includes(query) ||
        startDate.includes(query) ||
        endDate.includes(query) ||
        signedDate.includes(query) ||
        totalPrice.includes(query) ||
        address.includes(query)
      );
    });

    setFilteredContracts(filtered);
    setCurrentPage(1);
  }, [searchQuery, contracts]);

  // Formater une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Formater une date avec heure
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Fonction pour obtenir le titre du contrat
  const getContractTitle = (contract: any, lang: 'fr' | 'en' = 'fr'): string => {
    if (contract.pack_id) {
      const packName = getPackName(String(contract.pack_id), lang);
      if (packName) {
        return `Pack ${packName}`;
      }
    }
    if (contract.notes) {
      try {
        const parsedNotes = JSON.parse(contract.notes);
        if (parsedNotes?.cartItems && Array.isArray(parsedNotes.cartItems) && parsedNotes.cartItems.length > 0) {
          const firstItem = parsedNotes.cartItems[0];
          if (firstItem.productId?.startsWith('pack-') || firstItem.productId?.startsWith('pack_')) {
            const packId = firstItem.productId.replace('pack-', '').replace('pack_', '');
            const packName = getPackName(packId, lang);
            if (packName) {
              return `Pack ${packName}`;
            }
          }
          if (firstItem.productName) {
            return firstItem.productName;
          }
        }
      } catch (e) {
        // Ignorer
      }
    }
    return lang === 'fr' ? 'Contrat' : 'Contract';
  };

  // Fonction pour formater la date au format court
  const formatDateShort = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('fr-FR', { month: 'short' });
    const year = start.getFullYear();
    
    if (startDay === endDay) {
      return `${startDay} ${startMonth} ${year}`;
    }
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  };

  const texts = {
    fr: {
      title: 'Mes contrats',
      empty: 'Aucun contrat signé',
      emptyDescription: 'Vous n\'avez pas encore de contrats signés.',
      explorePacks: 'Voir les packs',
      reservationNumber: 'Réservation',
      signedOn: 'Signé le',
      downloadContract: 'Télécharger le contrat',
      dates: 'Dates de location',
      total: 'Total',
      deposit: 'Dépôt de garantie',
      page: 'Page',
      of: 'sur',
      previous: 'Précédent',
      next: 'Suivant',
    },
    en: {
      title: 'My contracts',
      empty: 'No signed contracts',
      emptyDescription: 'You don\'t have any signed contracts yet.',
      explorePacks: 'View packs',
      reservationNumber: 'Reservation',
      signedOn: 'Signed on',
      downloadContract: 'Download contract',
      dates: 'Rental dates',
      total: 'Total',
      deposit: 'Deposit',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <DashboardSidebar 
          language={language}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
        <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">♪</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SoundRush</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

          {/* Barre de recherche */}
          {contracts.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher par date, prix, numéro, adresse...' : 'Search by date, price, number, address...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 h-11"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  {language === 'fr' 
                    ? `${filteredContracts.length} contrat${filteredContracts.length > 1 ? 's' : ''} trouvé${filteredContracts.length > 1 ? 's' : ''}`
                    : `${filteredContracts.length} contract${filteredContracts.length > 1 ? 's' : ''} found`}
                </p>
              )}
            </div>
          )}

          {filteredContracts.length === 0 && contracts.length > 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Search className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{language === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}</CardTitle>
                <CardDescription className="mb-8">{language === 'fr' ? 'Essayez avec d\'autres mots-clés' : 'Try with different keywords'}</CardDescription>
                <Button
                  onClick={() => setSearchQuery('')}
                  className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                >
                  {language === 'fr' ? 'Effacer la recherche' : 'Clear search'}
                </Button>
              </CardContent>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <CardTitle className="text-xl mb-2">{currentTexts.empty}</CardTitle>
                <CardDescription className="mb-8">{currentTexts.emptyDescription}</CardDescription>
                <Button asChild className="bg-[#F2431E] hover:bg-[#E63A1A] text-white">
                  <Link href="/packs">
                    {currentTexts.explorePacks}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Calculer la pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedContracts = filteredContracts.slice(startIndex, endIndex);
                
                return (
                  <>
                    <div className="space-y-4 mb-6">
                      {paginatedContracts.map((contract) => {
                        const reservationNumber = contract.id.slice(0, 8).toUpperCase();
                        const contractTitle = getContractTitle(contract, language);
                        const dateRange = formatDateShort(contract.start_date, contract.end_date);
                        const signedDate = contract.client_signed_at 
                          ? new Date(contract.client_signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : null;
                        
                        return (
                          <Card 
                            key={contract.id} 
                            className="hover:shadow-md transition-all"
                          >
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Badge de statut avec point coloré */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-green-100 text-green-800 border-0 px-3 py-1">
                                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block"></span>
                                      {language === 'fr' ? 'Contrat signé' : 'Contract signed'}
                                    </Badge>
                                  </div>
                                  
                                  {/* Titre du contrat */}
                                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                                    {contractTitle}
                                  </h3>
                                  
                                  {/* Date de signature */}
                                  {signedDate && (
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm">
                                        {language === 'fr' ? 'Signé le' : 'Signed on'} {signedDate}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Dates de location */}
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm">{dateRange}</span>
                                  </div>
                                  
                                  {/* Lieu */}
                                  {contract.address && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm truncate">{contract.address}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Bouton télécharger */}
                                <a
                                  href={`/api/contract/download?reservationId=${contract.id}`}
                                  download={`contrat-${reservationNumber}.pdf`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                                  title={currentTexts.downloadContract}
                                >
                                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
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
                          {currentTexts.page} {currentPage} {currentTexts.of} {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {currentTexts.previous}
                          </Button>
                          <Button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                          >
                            {currentTexts.next}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </main>
      </div>
      <Footer language={language} />
    </div>
  );
}

