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
  DollarSign
} from 'lucide-react';

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
              <div className="space-y-6 mb-6">
                {(() => {
                  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);
                  
                  return paginatedContracts.map((contract) => {
                    const reservationNumber = contract.id.slice(0, 8).toUpperCase();
                    
                    return (
                      <Card key={contract.id} className="hover:shadow-lg transition-all">
                        {/* Header avec statut */}
                        <CardHeader className="bg-green-50 border-b border-green-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">
                                  {currentTexts.reservationNumber} #{reservationNumber}
                                </CardTitle>
                                <div className="mt-2">
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    {language === 'fr' ? 'Contrat signé' : 'Contract signed'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                asChild
                                variant="default"
                                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                              >
                                <a
                                  href={`/api/contract/download?reservationId=${contract.id}`}
                                  download={`contrat-${reservationNumber}.pdf`}
                                >
                                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  <span className="hidden sm:inline">{currentTexts.downloadContract}</span>
                                  <span className="sm:hidden">PDF</span>
                                </a>
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                              >
                                <Link href={`/mes-reservations/${contract.id}`}>
                                  {language === 'fr' ? 'Voir la réservation' : 'View reservation'}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Contenu */}
                        <CardContent className="p-4 sm:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Informations principales */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.dates}</h4>
                                <div className="flex items-center gap-2 text-gray-900">
                                  <Calendar className="w-5 h-5 text-[#F2431E]" />
                                  <span className="font-medium">{formatDate(contract.start_date)}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium">{formatDate(contract.end_date)}</span>
                                </div>
                              </div>

                              {contract.client_signed_at && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 mb-2">{currentTexts.signedOn}</h4>
                                  <div className="flex items-center gap-2 text-gray-900">
                                    <Calendar className="w-5 h-5 text-[#F2431E]" />
                                    <span className="font-medium">{formatDateTime(contract.client_signed_at)}</span>
                                  </div>
                                </div>
                              )}

                              {contract.address && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 mb-2">{language === 'fr' ? 'Adresse' : 'Address'}</h4>
                                  <div className="flex items-start gap-2 text-gray-900">
                                    <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0 mt-0.5" />
                                    <p className="text-gray-900">{contract.address}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Informations financières */}
                            <div className="space-y-4">
                              <Card className="bg-gray-50 border-gray-200">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-semibold text-gray-500">
                                    {language === 'fr' ? 'Informations financières' : 'Financial information'}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-0">
                                  {contract.total_price && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">{currentTexts.total}</span>
                                      <span className="text-lg font-bold text-gray-900">{parseFloat(contract.total_price).toFixed(2)}€</span>
                                    </div>
                                  )}
                                  {contract.deposit_amount && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">{currentTexts.deposit}</span>
                                      <span className="font-semibold text-gray-900">{parseFloat(contract.deposit_amount).toFixed(2)}€</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>

              {/* Pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
                return totalPages > 1 ? (
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
                ) : null;
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

