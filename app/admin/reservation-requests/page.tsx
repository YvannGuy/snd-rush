'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { getBasePack, generateCustomerSummary, calculateExtrasTotal, type PackItem } from '@/lib/packs/basePacks';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface ReservationRequest {
  id: string;
  pack_key: 'conference' | 'soiree' | 'mariage';
  status: 'NEW' | 'PENDING_REVIEW' | 'APPROVED' | 'ADJUSTED' | 'REJECTED';
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  payload: Record<string, any>;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminReservationRequestsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'NEW' | 'PENDING_REVIEW'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ReservationRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'adjust' | 'reject' | null>(null);
  const [priceTotal, setPriceTotal] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Toggles pour analyse admin
  const [adminFlags, setAdminFlags] = useState({
    needsExtraMicro: false,
    complexAcoustics: false,
    lateNight: false,
    difficultAccess: false,
  });
  
  // Message client pour ajustement
  const [clientMessage, setClientMessage] = useState('');
  
  // Items finaux du pack (avec ajustements admin)
  const [finalItems, setFinalItems] = useState<PackItem[]>([]);
  
  // Résumé client généré automatiquement
  const [customerSummary, setCustomerSummary] = useState('');
  
  // Dialog catalogue pro
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; name: string; category: string | null; daily_price_ttc: number }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Calcul automatique des prix
  const [basePackPrice, setBasePackPrice] = useState<number>(0);
  const [extrasTotal, setExtrasTotal] = useState<number>(0);

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, router]);

  // Recalculer automatiquement les prix quand finalItems change
  useEffect(() => {
    if (!selectedRequest) return;
    
    const basePack = getBasePack(selectedRequest.pack_key);
    if (!basePack) return;
    
    const recalculatePrices = async () => {
      // Calculer les extras
      const extras = await calculateExtrasTotal(
        finalItems,
        basePack.defaultItems,
        products.map(p => ({ name: p.name, daily_price_ttc: p.daily_price_ttc }))
      );
      
      setExtrasTotal(extras);
      const total = basePack.basePrice + extras;
      setPriceTotal(total.toString());
      setDepositAmount(Math.round(total * 0.3).toString()); // 30% de caution
    };
    
    recalculatePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalItems, selectedRequest?.pack_key, products.length]);

  useEffect(() => {
    if (!isAdmin) return;
    
    const loadRequests = async () => {
      try {
        // Récupérer le token d'authentification
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
        
        const response = await fetch('/api/admin/reservation-requests', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRequests();
    
    // Recharger toutes les 30 secondes pour avoir les nouvelles demandes
    const interval = setInterval(loadRequests, 30000);
    
    // Écouter les changements pour mettre à jour les compteurs
    const handleStorageChange = () => {
      loadRequests();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pendingActionsUpdated', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pendingActionsUpdated', handleStorageChange);
    };
  }, [isAdmin]);

  // Fonction pour ouvrir le modal avec une demande
  const handleOpenModal = (request: ReservationRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
    
    // Marquer la demande comme vue dans localStorage
    const viewedRequests = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('admin_viewed_reservation_requests') || '[]')
      : [];
    
    if (!viewedRequests.includes(request.id)) {
      viewedRequests.push(request.id);
      localStorage.setItem('admin_viewed_reservation_requests', JSON.stringify(viewedRequests));
      
      // Déclencher un événement pour mettre à jour les compteurs
      window.dispatchEvent(new Event('pendingActionsUpdated'));
    }
    
    // Pré-remplir les prix selon le pack
    const packPrices: Record<string, { total: number; deposit: number }> = {
      'conference': { total: 279, deposit: 84 },
      'soiree': { total: 329, deposit: 99 },
      'mariage': { total: 449, deposit: 135 }
    };
    const prices = packPrices[request.pack_key] || { total: 0, deposit: 0 };
    setPriceTotal(prices.total.toString());
    setDepositAmount(prices.deposit.toString());
    setAction(null);
    setNotes('');
    setRejectionReason('');
    setClientMessage('');
    
    // Réinitialiser les flags admin
    setAdminFlags({
      needsExtraMicro: false,
      complexAcoustics: false,
      lateNight: false,
      difficultAccess: false,
    });
    
    // Initialiser les items finaux avec le pack de base
    const basePack = getBasePack(request.pack_key);
    if (basePack) {
      setFinalItems([...basePack.defaultItems]);
      setBasePackPrice(basePack.basePrice);
      setExtrasTotal(0);
      // Générer le résumé client initial
      const summary = generateCustomerSummary(
        request.pack_key,
        basePack.defaultItems,
        request.payload.peopleCount
      );
      setCustomerSummary(summary);
      // Pré-remplir les prix selon le pack
      const totalPrice = basePack.basePrice;
      setPriceTotal(totalPrice.toString());
      setDepositAmount(Math.round(totalPrice * 0.3).toString()); // 30% de caution
    } else {
      setFinalItems([]);
      setCustomerSummary('');
      setBasePackPrice(0);
      setExtrasTotal(0);
    }
  };
  
  // Helper pour formater les dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non renseigné';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };
  
  // Helper pour formater les heures
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Non renseigné';
    // Si c'est déjà au format HH:mm, le retourner tel quel
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    // Sinon essayer de parser une date complète
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };
  
  // Helper pour obtenir le statut en français
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'NEW': 'Nouvelle',
      'PENDING_REVIEW': 'En attente',
      'APPROVED': 'Validée',
      'ADJUSTED': 'Ajustée',
      'REJECTED': 'Refusée'
    };
    return labels[status] || status;
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setAction(null);
  };

  // Fonction pour approuver une demande
  const handleApprove = async () => {
    if (!selectedRequest || !priceTotal || !depositAmount) return;
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
      
      // Construire les notes avec les flags admin
      const adminNotes = {
        internalNotes: notes || null,
        adminFlags: adminFlags,
      };
      
      const response = await fetch(`/api/admin/reservation-requests/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          price_total: parseFloat(priceTotal),
          deposit_amount: parseFloat(depositAmount),
          notes: JSON.stringify(adminNotes),
          final_items: finalItems,
          customer_summary: customerSummary,
          base_pack_price: basePackPrice,
          extras_total: extrasTotal,
        }),
      });
      
      if (response.ok) {
        // Recharger les demandes
        const loadRequests = async () => {
          const response = await fetch('/api/admin/reservation-requests', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setRequests(data.requests || []);
          }
        };
        await loadRequests();
        handleCloseModal();
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

  // Fonction pour ajuster une demande
  const handleAdjust = async () => {
    if (!selectedRequest || !priceTotal || !depositAmount || !clientMessage) return;
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
      
      // Construire les notes avec les flags admin et le message client
      const adminNotes = {
        internalNotes: notes || null,
        adminFlags: adminFlags,
        clientMessage: clientMessage,
      };
      
      const response = await fetch(`/api/admin/reservation-requests/adjust`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          price_total: parseFloat(priceTotal),
          deposit_amount: parseFloat(depositAmount),
          notes: JSON.stringify(adminNotes),
          client_message: clientMessage, // Message visible par le client
          final_items: finalItems,
          customer_summary: customerSummary,
          base_pack_price: basePackPrice,
          extras_total: extrasTotal,
        }),
      });
      
      if (response.ok) {
        // Recharger les demandes
        const loadRequests = async () => {
          const response = await fetch('/api/admin/reservation-requests', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setRequests(data.requests || []);
          }
        };
        await loadRequests();
        handleCloseModal();
        
        // Déclencher un événement pour mettre à jour les compteurs dans AdminSidebar
        window.dispatchEvent(new Event('pendingActionsUpdated'));
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

  // Fonction pour refuser une demande
  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;
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
          request_id: selectedRequest.id,
          reason: rejectionReason,
        }),
      });
      
      if (response.ok) {
        // Recharger les demandes
        const loadRequests = async () => {
          const response = await fetch('/api/admin/reservation-requests', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setRequests(data.requests || []);
          }
        };
        await loadRequests();
        handleCloseModal();
        
        // Déclencher un événement pour mettre à jour les compteurs dans AdminSidebar
        window.dispatchEvent(new Event('pendingActionsUpdated'));
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

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getPackName = (packKey: string) => {
    const names: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };
    return names[packKey] || packKey;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'NEW': 'bg-blue-100 text-blue-800',
      'PENDING_REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'ADJUSTED': 'bg-purple-100 text-purple-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

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
            <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Demandes de réservation
            </h1>
            
            {/* Filtres */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Toutes
              </Button>
              <Button
                variant={filter === 'NEW' ? 'default' : 'outline'}
                onClick={() => setFilter('NEW')}
              >
                Nouvelles ({requests.filter(r => r.status === 'NEW').length})
              </Button>
              <Button
                variant={filter === 'PENDING_REVIEW' ? 'default' : 'outline'}
                onClick={() => setFilter('PENDING_REVIEW')}
              >
                En attente ({requests.filter(r => r.status === 'PENDING_REVIEW').length})
              </Button>
            </div>
            
            {/* Liste des demandes */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Aucune demande trouvée
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map((request) => {
                  // Vérifier si la demande est nouvelle (non vue)
                  const viewedRequests = typeof window !== 'undefined'
                    ? JSON.parse(localStorage.getItem('admin_viewed_reservation_requests') || '[]')
                    : [];
                  const isNew = (request.status === 'NEW' || request.status === 'PENDING_REVIEW') 
                    && !viewedRequests.includes(request.id);
                  
                  return (
                    <Card 
                      key={request.id} 
                      className={`hover:shadow-md transition-shadow cursor-pointer ${isNew ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleOpenModal(request)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {getPackName(request.pack_key)}
                              </h3>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                              {isNew && (
                                <Badge className="bg-blue-500 text-white">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Client:</strong> {request.customer_name || request.customer_email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Email:</strong> {request.customer_email}
                            </p>
                            {request.customer_phone && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Téléphone:</strong> {request.customer_phone}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Créée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Button variant="outline">
                              Voir détails →
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal professionnel pour les détails d'une demande */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          handleCloseModal();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          {selectedRequest && (
            <>
              {/* 1) HEADER DU MODAL */}
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-3">
                      Demande de réservation — {getPackName(selectedRequest.pack_key)}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(selectedRequest.status)}>
                        {getStatusLabel(selectedRequest.status)}
                      </Badge>
                      <Badge variant="outline" className="border-[#F2431E] text-[#F2431E]">
                        {getPackName(selectedRequest.pack_key)}
                      </Badge>
                      {selectedRequest.payload.startDate && selectedRequest.payload.endDate && (
                        <Badge variant="outline">
                          {formatDate(selectedRequest.payload.startDate)} → {formatDate(selectedRequest.payload.endDate)}
                        </Badge>
                      )}
                      {selectedRequest.payload.peopleCount && (
                        <Badge variant="outline">
                          {selectedRequest.payload.peopleCount} personne{selectedRequest.payload.peopleCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* 2) SECTION CLIENT */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Nom</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.customer_name || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{selectedRequest.customer_email}</p>
                      </div>
                      {selectedRequest.customer_phone && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                          <p className="font-semibold text-gray-900">{selectedRequest.customer_phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date de la demande</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {selectedRequest.customer_phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${selectedRequest.customer_phone}`, '_self')}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Appeler
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`mailto:${selectedRequest.customer_email}`, '_self')}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Envoyer un email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 3) SECTION RÉSUMÉ DE L'ÉVÉNEMENT (READ-ONLY) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé de l'événement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Type d'événement</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.eventType || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Lieu</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.indoorOutdoor === 'intérieur' ? 'Intérieur' : 
                           selectedRequest.payload.indoorOutdoor === 'extérieur' ? 'Extérieur' : 
                           'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Nombre de personnes</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.peopleCount || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Ambiance</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.ambiance || 
                           (selectedRequest.payload.vibe === 'voix' ? 'Voix/Discours' :
                            selectedRequest.payload.vibe === 'dj' ? 'DJ/Son fort' :
                            selectedRequest.payload.vibe === 'ambiance' ? 'Musique d\'ambiance' :
                            'Non renseigné')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Besoin micro</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.ambiance?.includes('discours') || 
                           selectedRequest.payload.ambiance?.includes('animation') ||
                           selectedRequest.payload.vibe === 'voix' ? 'Oui' : 'Non'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date et heure de début</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.startDate ? (
                            <>
                              {formatDate(selectedRequest.payload.startDate)}
                              {selectedRequest.payload.startTime && ` à ${formatTime(selectedRequest.payload.startTime)}`}
                            </>
                          ) : 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date et heure de fin</p>
                        <p className="font-semibold text-gray-900">
                          {selectedRequest.payload.endDate ? (
                            <>
                              {formatDate(selectedRequest.payload.endDate)}
                              {selectedRequest.payload.endTime && ` à ${formatTime(selectedRequest.payload.endTime)}`}
                            </>
                          ) : 'Non renseigné'}
                        </p>
                      </div>
                      {selectedRequest.payload.address && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Adresse</p>
                          <p className="font-semibold text-gray-900">{selectedRequest.payload.address}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 4) SECTION CONTENU DU PACK (BASE) */}
                {(() => {
                  const basePack = getBasePack(selectedRequest.pack_key);
                  if (!basePack) return null;
                  
                  return (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Contenu du pack (base)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">{basePack.description}</p>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <ul className="space-y-2">
                              {basePack.defaultItems.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{item.label}</span>
                                  <span className="font-semibold text-gray-900">× {item.qty}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-gray-600">
                              📦 Pack clé en main — livraison, installation et récupération incluses
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* 4b) SECTION CONFIGURATION FINALE */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Configuration finale</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePack = getBasePack(selectedRequest.pack_key);
                          if (basePack) {
                            setFinalItems([...basePack.defaultItems]);
                            const summary = generateCustomerSummary(
                              selectedRequest.pack_key,
                              basePack.defaultItems,
                              selectedRequest.payload.peopleCount
                            );
                            setCustomerSummary(summary);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Réinitialiser
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {finalItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{item.label}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (item.qty > 1) {
                                  const newItems = [...finalItems];
                                  newItems[idx] = { ...item, qty: item.qty - 1 };
                                  setFinalItems(newItems);
                                  const summary = generateCustomerSummary(
                                    selectedRequest.pack_key,
                                    newItems,
                                    selectedRequest.payload.peopleCount
                                  );
                                  setCustomerSummary(summary);
                                }
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const newItems = [...finalItems];
                                newItems[idx] = { ...item, qty: item.qty + 1 };
                                setFinalItems(newItems);
                                const summary = generateCustomerSummary(
                                  selectedRequest.pack_key,
                                  newItems,
                                  selectedRequest.payload.peopleCount
                                );
                                setCustomerSummary(summary);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const newItems = finalItems.filter((_, i) => i !== idx);
                                setFinalItems(newItems);
                                const summary = generateCustomerSummary(
                                  selectedRequest.pack_key,
                                  newItems,
                                  selectedRequest.payload.peopleCount
                                );
                                setCustomerSummary(summary);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setIsCatalogOpen(true);
                        if (products.length === 0) {
                          setLoadingProducts(true);
                          try {
                            const { supabase } = await import('@/lib/supabase');
                            if (supabase) {
                              const { data, error } = await supabase
                                .from('products')
                                .select('id, name, category, daily_price_ttc')
                                .order('name', { ascending: true });
                              
                              if (!error && data) {
                                setProducts(data);
                              }
                            }
                          } catch (error) {
                            console.error('Erreur chargement produits:', error);
                          } finally {
                            setLoadingProducts(false);
                          }
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter depuis le catalogue
                    </Button>
                    
                    {/* Résumé client généré automatiquement */}
                    {customerSummary && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <Label className="text-sm font-medium text-green-900 mb-2 block">
                          Solution proposée (ce que voit le client)
                        </Label>
                        <p className="text-sm text-green-800 italic">{customerSummary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5) SECTION ANALYSE ADMIN & AJUSTEMENTS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyse admin & ajustements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="extra-micro" className="text-sm font-medium cursor-pointer">
                            Micro supplémentaire
                          </Label>
                        </div>
                        <Switch
                          id="extra-micro"
                          checked={adminFlags.needsExtraMicro}
                          onCheckedChange={(checked) => setAdminFlags({ ...adminFlags, needsExtraMicro: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="complex-acoustics" className="text-sm font-medium cursor-pointer">
                            Salle grande / acoustique complexe
                          </Label>
                        </div>
                        <Switch
                          id="complex-acoustics"
                          checked={adminFlags.complexAcoustics}
                          onCheckedChange={(checked) => setAdminFlags({ ...adminFlags, complexAcoustics: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="late-night" className="text-sm font-medium cursor-pointer">
                            Horaire tardif / nuit
                          </Label>
                        </div>
                        <Switch
                          id="late-night"
                          checked={adminFlags.lateNight}
                          onCheckedChange={(checked) => setAdminFlags({ ...adminFlags, lateNight: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="difficult-access" className="text-sm font-medium cursor-pointer">
                            Accès compliqué (étage, pas d'ascenseur)
                          </Label>
                        </div>
                        <Switch
                          id="difficult-access"
                          checked={adminFlags.difficultAccess}
                          onCheckedChange={(checked) => setAdminFlags({ ...adminFlags, difficultAccess: checked })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="admin-notes" className="text-sm font-medium mb-2 block">
                        Note interne (Ajustements internes - non visible client)
                      </Label>
                      <Textarea
                        id="admin-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes internes pour l'équipe..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 6) SECTION PRIX & DÉCISION */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prix & décision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Prix de base du pack</span>
                          <span className="text-lg font-bold text-gray-900">{basePackPrice}€</span>
                        </div>
                        {extrasTotal > 0 && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-gray-700">Extras ajoutés</span>
                            <span className="text-lg font-bold text-blue-900">+{extrasTotal}€</span>
                          </div>
                        )}
                      </div>
                      {(adminFlags.needsExtraMicro || adminFlags.complexAcoustics || adminFlags.lateNight || adminFlags.difficultAccess) && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-2">
                            ⚠️ Ajustements détectés — Prix à confirmer selon les options sélectionnées
                          </p>
                          <div className="space-y-2 text-sm">
                            {adminFlags.needsExtraMicro && <p>• Micro supplémentaire</p>}
                            {adminFlags.complexAcoustics && <p>• Acoustique complexe</p>}
                            {adminFlags.lateNight && <p>• Horaire tardif</p>}
                            {adminFlags.difficultAccess && <p>• Accès compliqué</p>}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-4 bg-[#F2431E]/10 rounded-lg border border-[#F2431E]/20">
                        <span className="text-gray-900 font-semibold">Total estimé</span>
                        <span className="text-2xl font-bold text-[#F2431E]">
                          {priceTotal ? `${priceTotal}€` : 'À confirmer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Caution</span>
                        <span className="font-semibold text-gray-900">{depositAmount || '0'}€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 7) ACTIONS PRINCIPALES */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Décision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Valider */}
                    {action === 'approve' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Prix total (€) *</Label>
                            <Input
                              type="number"
                              value={priceTotal}
                              onChange={(e) => setPriceTotal(e.target.value)}
                              placeholder="279"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Caution (€) *</Label>
                            <Input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="84"
                              required
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleApprove}
                          disabled={processing || !priceTotal || !depositAmount}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processing ? 'Traitement...' : '✅ Valider la demande'}
                        </Button>
                      </div>
                    )}

                    {/* Ajuster */}
                    {action === 'adjust' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Message au client *</Label>
                          <Textarea
                            value={clientMessage}
                            onChange={(e) => setClientMessage(e.target.value)}
                            placeholder="Bonjour, votre demande nécessite quelques ajustements..."
                            rows={3}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Nouveau prix total (€) *</Label>
                            <Input
                              type="number"
                              value={priceTotal}
                              onChange={(e) => setPriceTotal(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Caution (€) *</Label>
                            <Input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleAdjust}
                          disabled={processing || !priceTotal || !depositAmount || !clientMessage}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {processing ? 'Traitement...' : '🟠 Ajuster avant validation'}
                        </Button>
                      </div>
                    )}

                    {/* Refuser */}
                    {action === 'reject' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Motif du refus *</Label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Indisponibilité, délai trop court, contraintes logistiques..."
                            rows={4}
                            required
                          />
                        </div>
                        <Button
                          onClick={handleReject}
                          disabled={processing || !rejectionReason}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {processing ? 'Traitement...' : '🔴 Refuser'}
                        </Button>
                      </div>
                    )}

                    {/* Boutons d'action si aucune action sélectionnée */}
                    {!action && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          onClick={() => setAction('approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          🟢 Valider la demande
                        </Button>
                        <Button
                          onClick={() => setAction('adjust')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          🟠 Ajuster avant validation
                        </Button>
                        <Button
                          onClick={() => setAction('reject')}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          🔴 Refuser
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 8) HISTORIQUE */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 pb-3 border-b">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Demande créée</p>
                          <p className="text-xs text-gray-500">
                            {new Date(selectedRequest.created_at).toLocaleString('fr-FR')} — Système
                          </p>
                        </div>
                      </div>
                      {selectedRequest.updated_at !== selectedRequest.created_at && (
                        <div className="flex items-start gap-3 pb-3 border-b">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Dernière mise à jour</p>
                            <p className="text-xs text-gray-500">
                              {new Date(selectedRequest.updated_at).toLocaleString('fr-FR')} — Système
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.status === 'APPROVED' && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Demande validée</p>
                            <p className="text-xs text-gray-500">Admin</p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.status === 'REJECTED' && selectedRequest.rejection_reason && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Demande refusée</p>
                            <p className="text-xs text-gray-500 mb-1">Admin</p>
                            <p className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                              {selectedRequest.rejection_reason}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog Catalogue Pro */}
      <Dialog open={isCatalogOpen && !!selectedRequest} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Catalogue pro — Ajouter des produits</DialogTitle>
          </DialogHeader>
          
          {!selectedRequest ? (
            <div className="text-center py-8 text-gray-500">
              Aucune demande sélectionnée.
            </div>
          ) : loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F2431E]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {products.map((product) => {
                  const isAlreadyAdded = finalItems.some(item => item.label === product.name);
                  
                  return (
                    <Card key={product.id} className={isAlreadyAdded ? 'bg-green-50 border-green-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                            {product.category && (
                              <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                            )}
                            <p className="text-sm font-bold text-[#F2431E]">
                              {product.daily_price_ttc}€ / jour
                            </p>
                          </div>
                          <Button
                            variant={isAlreadyAdded ? "secondary" : "default"}
                            size="sm"
                              onClick={() => {
                                if (!selectedRequest) return;
                                
                                let newItems: PackItem[];
                                if (isAlreadyAdded) {
                                  // Augmenter la quantité
                                  newItems = finalItems.map(item =>
                                    item.label === product.name
                                      ? { ...item, qty: item.qty + 1 }
                                      : item
                                  );
                                } else {
                                  // Ajouter le produit
                                  newItems = [...finalItems, { label: product.name, qty: 1 }];
                                }
                                setFinalItems(newItems);
                                const summary = generateCustomerSummary(
                                  selectedRequest.pack_key,
                                  newItems,
                                  selectedRequest.payload.peopleCount
                                );
                                setCustomerSummary(summary);
                              }}
                            className="ml-2"
                          >
                            {isAlreadyAdded ? (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </>
                            )}
                          </Button>
                        </div>
                        {isAlreadyAdded && (
                          <p className="text-xs text-green-700 mt-2">
                            ✓ Déjà ajouté ({finalItems.find(item => item.label === product.name)?.qty}x)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit trouvé dans le catalogue.
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCatalogOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer language={language} />
    </div>
  );
}
