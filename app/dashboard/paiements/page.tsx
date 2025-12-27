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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle2, Clock, Menu } from 'lucide-react';
import { loadDashboardData } from '@/lib/dashboardDataLoader';
import { ReservationView } from '@/types/reservationView';
import { supabase } from '@/lib/supabase';

export default function PaiementsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [paymentViews, setPaymentViews] = useState<ReservationView[]>([]);
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
        // Filtrer les réservations avec paiements en attente
        const pending = reservationViews.filter(
          view => !view.depositPaid || !view.balancePaid
        );
        setPaymentViews(pending);
      } catch (error) {
        console.error('Erreur chargement paiements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handlePayment = async (view: ReservationView, type: 'deposit' | 'balance') => {
    try {
      const { supabase } = await import('@/lib/supabase');
      let authHeader = '';
      
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeader = `Bearer ${session.access_token}`;
        }
      }
      
      const apiEndpoint = type === 'deposit'
        ? '/api/payments/create-checkout-session'
        : '/api/payments/create-balance-session';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify({
          reservation_id: view.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Erreur: URL de paiement non reçue');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la session de paiement');
    }
  };

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
      <div className="flex flex-1">
        <DashboardSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        <main className={`flex-1 p-6 max-w-4xl mx-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes paiements</h1>

          {paymentViews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucun paiement en attente
                </h2>
                <p className="text-gray-600">
                  Tous vos paiements sont à jour.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paymentViews.map((view) => (
                <Card key={view.id} className="border-2 border-orange-500">
                  <CardHeader>
                    <CardTitle>{view.packLabel}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Acompte */}
                    {!view.depositPaid && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold text-gray-900">Acompte 30%</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            {view.depositAmount ? `${view.depositAmount}€` : 'À calculer'}
                          </span>
                        </div>
                        <Button
                          onClick={() => handlePayment(view, 'deposit')}
                          className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                        >
                          Payer l'acompte (30%)
                        </Button>
                      </div>
                    )}

                    {/* Solde */}
                    {view.depositPaid && !view.balancePaid && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-gray-900">Solde restant</span>
                          </div>
                          <span className="font-bold text-yellow-600">
                            {view.balanceAmount ? `${view.balanceAmount.toFixed(2)}€` : 'À calculer'}
                          </span>
                        </div>
                        <Button
                          onClick={() => handlePayment(view, 'balance')}
                          className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                        >
                          Payer le solde maintenant
                        </Button>
                      </div>
                    )}

                    {/* Informations */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {view.startAt && (
                        <p>
                          <strong>Date:</strong> {new Date(view.startAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                      {view.address && (
                        <p>
                          <strong>Lieu:</strong> {view.address}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
