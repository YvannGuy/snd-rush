'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';

interface ReservationRequest {
  id: string;
  pack_key: 'conference' | 'soiree' | 'mariage';
  status: string;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  payload: Record<string, any>;
  rejection_reason?: string;
  created_at: string;
}

export default function AdminReservationRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, checkingAdmin } = useAdmin();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [request, setRequest] = useState<ReservationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'approve' | 'adjust' | 'reject' | null>(null);
  const [priceTotal, setPriceTotal] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, router]);

  useEffect(() => {
    if (!isAdmin || !params.id) return;
    
    const loadRequest = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        if (!supabase) {
          setLoading(false);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/admin/reservation-requests/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setRequest(data.request);
          // Pré-remplir les prix selon le pack
          if (data.request) {
            const packPrices: Record<string, { total: number; deposit: number }> = {
              'conference': { total: 279, deposit: 84 },
              'soiree': { total: 329, deposit: 99 },
              'mariage': { total: 449, deposit: 135 }
            };
            const prices = packPrices[data.request.pack_key] || { total: 0, deposit: 0 };
            setPriceTotal(prices.total.toString());
            setDepositAmount(prices.deposit.toString());
          }
        }
      } catch (error) {
        console.error('Erreur chargement demande:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRequest();
  }, [isAdmin, params.id]);

  const handleApprove = async () => {
    if (!request || !priceTotal || !depositAmount) return;
    setProcessing(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        alert('Erreur de configuration');
        setProcessing(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, veuillez vous reconnecter');
        setProcessing(false);
        return;
      }
      
      const response = await fetch(`/api/admin/reservation-requests/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: request.id,
          price_total: parseFloat(priceTotal),
          deposit_amount: parseFloat(depositAmount),
          notes: notes || null,
        }),
      });
      
      if (response.ok) {
        router.push('/admin/reservation-requests');
      } else {
        alert('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjust = async () => {
    if (!request || !priceTotal || !depositAmount) return;
    setProcessing(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        alert('Erreur de configuration');
        setProcessing(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, veuillez vous reconnecter');
        setProcessing(false);
        return;
      }
      
      const response = await fetch(`/api/admin/reservation-requests/adjust`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: request.id,
          price_total: parseFloat(priceTotal),
          deposit_amount: parseFloat(depositAmount),
          notes: notes || null,
        }),
      });
      
      if (response.ok) {
        router.push('/admin/reservation-requests');
      } else {
        alert('Erreur lors de l\'ajustement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajustement');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request || !rejectionReason) return;
    setProcessing(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        alert('Erreur de configuration');
        setProcessing(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, veuillez vous reconnecter');
        setProcessing(false);
        return;
      }
      
      const response = await fetch(`/api/admin/reservation-requests/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: request.id,
          reason: rejectionReason,
        }),
      });
      
      if (response.ok) {
        router.push('/admin/reservation-requests');
      } else {
        alert('Erreur lors du refus');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  const getPackName = (packKey: string) => {
    const names: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };
    return names[packKey] || packKey;
  };

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!isAdmin || !request) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <div className="flex flex-1 lg:flex-row">
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

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-6"
            >
              ← Retour
            </Button>
            
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {getPackName(request.pack_key)}
                  </CardTitle>
                  <Badge className={request.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Client:</strong> {request.customer_name || 'Non renseigné'}
                </div>
                <div>
                  <strong>Email:</strong> {request.customer_email}
                </div>
                {request.customer_phone && (
                  <div>
                    <strong>Téléphone:</strong> {request.customer_phone}
                  </div>
                )}
                <div>
                  <strong>Créée le:</strong> {new Date(request.created_at).toLocaleString('fr-FR')}
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold mb-2">Détails de la demande:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(request.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Valider */}
                <div>
                  <Button
                    onClick={() => setAction(action === 'approve' ? null : 'approve')}
                    className="w-full mb-4"
                    variant={action === 'approve' ? 'default' : 'outline'}
                  >
                    ✅ Valider
                  </Button>
                  {action === 'approve' && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Prix total (€)</label>
                        <Input
                          type="number"
                          value={priceTotal}
                          onChange={(e) => setPriceTotal(e.target.value)}
                          placeholder="279"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Caution (€)</label>
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="84"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes internes..."
                        />
                      </div>
                      <Button
                        onClick={handleApprove}
                        disabled={processing || !priceTotal || !depositAmount}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {processing ? 'Traitement...' : 'Confirmer la validation'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Ajuster */}
                <div>
                  <Button
                    onClick={() => setAction(action === 'adjust' ? null : 'adjust')}
                    className="w-full mb-4"
                    variant={action === 'adjust' ? 'default' : 'outline'}
                  >
                    ✏️ Ajuster
                  </Button>
                  {action === 'adjust' && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Prix total (€)</label>
                        <Input
                          type="number"
                          value={priceTotal}
                          onChange={(e) => setPriceTotal(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Caution (€)</label>
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAdjust}
                        disabled={processing || !priceTotal || !depositAmount}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {processing ? 'Traitement...' : 'Confirmer l\'ajustement'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Refuser */}
                <div>
                  <Button
                    onClick={() => setAction(action === 'reject' ? null : 'reject')}
                    className="w-full mb-4"
                    variant={action === 'reject' ? 'destructive' : 'outline'}
                  >
                    ❌ Refuser
                  </Button>
                  {action === 'reject' && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Motif du refus *</label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Indisponibilité, délai trop court, contraintes logistiques..."
                          required
                        />
                      </div>
                      <Button
                        onClick={handleReject}
                        disabled={processing || !rejectionReason}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {processing ? 'Traitement...' : 'Confirmer le refus'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </main>
      </div>
      
      <Footer language={language} />
    </div>
  );
}

