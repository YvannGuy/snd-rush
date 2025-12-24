'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentsPanel from '@/components/DocumentsPanel';
import { FileText, Calendar } from 'lucide-react';
import { loadDashboardData } from '@/lib/dashboardDataLoader';
import { ReservationView } from '@/types/reservationView';
import { pickNextReservation, isOrderRelatedToReservation } from '@/lib/reservationViewMapper';

export default function DocumentsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [reservationViews, setReservationViews] = useState<ReservationView[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [etatLieuxList, setEtatLieuxList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const data = await loadDashboardData(user);
        // Filtrer : max 10 récentes + à venir
        const now = new Date();
        const upcoming = data.reservationViews.filter(v => new Date(v.startAt) >= now);
        const recent = data.reservationViews
          .filter(v => new Date(v.startAt) < now)
          .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
          .slice(0, 10);
        
        setReservationViews([...upcoming, ...recent]);
        setOrders(data.orders);
        setEtatLieuxList(data.etatLieuxList);
      } catch (error) {
        console.error('Erreur chargement documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px]">
        <DashboardSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes documents</h1>

          {reservationViews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucun document disponible
                </h2>
                <p className="text-gray-600">
                  Vous n'avez pas encore de réservation avec des documents.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reservationViews.map((view) => {
                // Trouver les orders et etat_lieux liés
                const relatedOrders = orders.filter(order => 
                  isOrderRelatedToReservation(order, view.id, view.source)
                );

                const relatedEtatLieux = view.source === 'reservation'
                  ? etatLieuxList.find(el => el.reservation_id === view.id)
                  : null;

                return (
                  <Card key={view.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{view.packLabel}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(view.startAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DocumentsPanel
                        context="user"
                        reservation={{
                          id: view.id,
                          type: view.source === 'client_reservation' ? 'client_reservation' : 'reservation',
                          client_signature: view.raw?.client_signature || null,
                          client_signed_at: view.raw?.client_signed_at || null,
                          status: view.status,
                        }}
                        orders={relatedOrders}
                        etatLieux={relatedEtatLieux || undefined}
                        language={language}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Liens vers pages legacy */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Accès complet :</p>
            <div className="flex gap-4 text-sm">
              <a href="/mes-contrats" className="text-[#F2431E] hover:underline">
                Tous mes contrats →
              </a>
              <a href="/mes-factures" className="text-[#F2431E] hover:underline">
                Toutes mes factures →
              </a>
              <a href="/mes-etats-lieux" className="text-[#F2431E] hover:underline">
                Tous mes états des lieux →
              </a>
            </div>
          </div>
        </main>
      </div>
      <Footer language={language} />
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
      />
    </div>
  );
}
