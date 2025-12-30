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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Music, Package, Menu } from 'lucide-react';
import { loadDashboardData } from '@/lib/dashboardDataLoader';
import { pickNextReservation } from '@/lib/reservationViewMapper';
import { ReservationView } from '@/types/reservationView';
import Link from 'next/link';

export default function PrestationPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [nextView, setNextView] = useState<ReservationView | null>(null);
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
        const { reservationViews } = await loadDashboardData(user);
        const next = pickNextReservation(reservationViews);
        setNextView(next);
      } catch (error) {
        console.error('Erreur chargement prestation:', error);
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

  if (!nextView) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="flex flex-1">
          <DashboardSidebar
            language={language}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
          <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
            <Card>
              <CardContent className="p-8 text-center">
                <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune prestation à venir
                </h2>
                <p className="text-gray-600">
                  Vous n'avez pas de réservation programmée pour le moment.
                </p>
              </CardContent>
            </Card>
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

  // Parser final_items si disponible
  let finalItems: Array<{ label: string; qty: number }> = [];
  if (nextView.source === 'client_reservation' && nextView.raw?.final_items) {
    try {
      finalItems = typeof nextView.raw.final_items === 'string'
        ? JSON.parse(nextView.raw.final_items)
        : nextView.raw.final_items;
    } catch (e) {
      console.error('Erreur parsing final_items:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1">
        <DashboardSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(v => !v)}
              className="lg:hidden"
              aria-expanded={isSidebarOpen}
              aria-controls="dashboard-sidebar"
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

          <div className="p-6 max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Ma prestation</h1>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{nextView.packLabel}</CardTitle>
                <Badge variant="outline" className={
                  nextView.status === 'CONFIRMED' || nextView.status === 'confirmed'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }>
                  {nextView.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informations de base */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {new Date(nextView.startAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {nextView.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5" />
                    <span>{nextView.address}</span>
                  </div>
                )}
              </div>

              {/* Résumé client */}
              {nextView.summary && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 italic">{nextView.summary}</p>
                </div>
              )}

              {/* Contenu final */}
              {finalItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Contenu de la prestation
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {finalItems.map((item, idx) => (
                      <li key={idx}>
                        {item.qty} {item.label.toLowerCase()}{item.qty > 1 ? 's' : ''}
                      </li>
                    ))}
                  </ul>
                  {nextView.raw?.final_validated_at && (
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                      Validé
                    </Badge>
                  )}
                </div>
              )}

              {/* Services inclus */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-800">
                  📦 Pack clé en main — livraison, installation et récupération incluses
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link
              href="/dashboard/paiements"
              className="text-[#F2431E] hover:underline"
            >
              Voir mes paiements →
            </Link>
            <Link
              href="/dashboard/documents"
              className="text-[#F2431E] hover:underline"
            >
              Voir mes documents →
            </Link>
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
