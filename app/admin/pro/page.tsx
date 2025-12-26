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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2, XCircle, User, Briefcase, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AdminProPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [proRequests, setProRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'blocked'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

  // Charger les demandes pro
  useEffect(() => {
    if (!user || !isAdmin) return;

    const loadProRequests = async () => {
      setLoadingRequests(true);
      try {
        // Utiliser l'API route qui récupère les emails avec service role
        const response = await fetch('/api/admin/pro-requests');
        if (!response.ok) throw new Error('Erreur récupération demandes');
        
        const data = await response.json();
        setProRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      } catch (error) {
        console.error('Erreur chargement demandes pro:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadProRequests();
  }, [user, isAdmin]);

  // Filtrer les demandes
  useEffect(() => {
    let filtered = proRequests;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => {
        if (statusFilter === 'pending') {
          return req.pro_status === 'pending';
        }
        if (statusFilter === 'active') {
          return req.role === 'pro' && req.pro_status === 'active';
        }
        if (statusFilter === 'blocked') {
          return req.pro_status === 'blocked';
        }
        return true;
      });
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((req) => {
        return (
          req.email?.toLowerCase().includes(query) ||
          req.pro_type?.toLowerCase().includes(query) ||
          req.pro_usage?.toLowerCase().includes(query) ||
          req.first_name?.toLowerCase().includes(query) ||
          req.last_name?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, proRequests]);

  // Actions sur les demandes
  const handleActivate = async (userId: string) => {
    if (!supabase) return;
    setActionLoading(userId);
    try {
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Appeler l'API route sécurisée
      const response = await fetch('/api/admin/pro-requests/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'activation');
      }

      // Recharger les demandes via API
      const refreshResponse = await fetch('/api/admin/pro-requests');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setProRequests(refreshData.requests || []);
      }
      setIsDetailModalOpen(false);
    } catch (error: any) {
      console.error('Erreur activation pro:', error);
      alert(error.message || 'Erreur lors de l\'activation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId: string) => {
    if (!supabase) return;
    if (!confirm('Êtes-vous sûr de vouloir bloquer cet accès Pro ?')) return;

    setActionLoading(userId);
    try {
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Appeler l'API route sécurisée
      const response = await fetch('/api/admin/pro-requests/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du blocage');
      }

      // Recharger les demandes via API
      const refreshResponse = await fetch('/api/admin/pro-requests');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setProRequests(refreshData.requests || []);
      }
      setIsDetailModalOpen(false);
    } catch (error: any) {
      console.error('Erreur blocage pro:', error);
      alert(error.message || 'Erreur lors du blocage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!supabase) return;
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) return;

    setActionLoading(userId);
    try {
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Appeler l'API route sécurisée
      const response = await fetch('/api/admin/pro-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du refus');
      }

      // Recharger les demandes via API
      const refreshResponse = await fetch('/api/admin/pro-requests');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setProRequests(refreshData.requests || []);
      }
      setIsDetailModalOpen(false);
    } catch (error: any) {
      console.error('Erreur refus demande:', error);
      alert(error.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const texts = {
    fr: {
      title: 'Gestion des accès Pro',
      subtitle: 'Gérer les demandes d\'accès à l\'espace professionnel',
      searchPlaceholder: 'Rechercher par email, nom, type...',
      filterAll: 'Tous',
      filterPending: 'En attente',
      filterActive: 'Actifs',
      filterBlocked: 'Bloqués',
      noRequests: 'Aucune demande',
      status: 'Statut',
      type: 'Type',
      usage: 'Usage',
      email: 'Email',
      phone: 'Téléphone',
      createdAt: 'Date de demande',
      actions: 'Actions',
      viewDetails: 'Voir détails',
      activate: 'Activer',
      block: 'Bloquer',
      reject: 'Refuser',
      details: 'Détails de la demande',
      proType: 'Type de professionnel',
      proUsage: 'Usage prévu',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder à la gestion des accès Pro.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Pro Access Management',
      subtitle: 'Manage professional space access requests',
      searchPlaceholder: 'Search by email, name, type...',
      filterAll: 'All',
      filterPending: 'Pending',
      filterActive: 'Active',
      filterBlocked: 'Blocked',
      noRequests: 'No requests',
      status: 'Status',
      type: 'Type',
      usage: 'Usage',
      email: 'Email',
      phone: 'Phone',
      createdAt: 'Request date',
      actions: 'Actions',
      viewDetails: 'View details',
      activate: 'Activate',
      block: 'Block',
      reject: 'Reject',
      details: 'Request details',
      proType: 'Professional type',
      proUsage: 'Intended usage',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access Pro access management.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
        </div>
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

  if (!isAdmin) {
    return null;
  }

  const getStatusBadge = (request: any) => {
    if (request.role === 'pro' && request.pro_status === 'active') {
      return <Badge className="bg-green-500 text-white">Actif</Badge>;
    }
    if (request.pro_status === 'pending') {
      return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
    }
    if (request.pro_status === 'blocked') {
      return <Badge className="bg-red-500 text-white">Bloqué</Badge>;
    }
    return <Badge className="bg-gray-500 text-white">Inconnu</Badge>;
  };

  const getProTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      dj: { fr: 'DJ', en: 'DJ' },
      tech: { fr: 'Technicien son/lumière', en: 'Sound/Light technician' },
      orga: { fr: 'Organisateur d\'événements', en: 'Event organizer' },
      autre: { fr: 'Autre', en: 'Other' },
    };
    return labels[type]?.[language] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <div className="hidden lg:block flex-shrink-0 transition-all duration-300 w-64"></div>
        <AdminSidebar language={language} />
        <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {currentTexts.title}
                </h1>
                <p className="text-gray-600">
                  {currentTexts.subtitle}
                </p>
              </div>

              {/* Filtres */}
              <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Recherche */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={currentTexts.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  {/* Filtre statut */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        statusFilter === 'all'
                          ? 'bg-[#F2431E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentTexts.filterAll}
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        statusFilter === 'pending'
                          ? 'bg-[#F2431E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentTexts.filterPending}
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        statusFilter === 'active'
                          ? 'bg-[#F2431E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentTexts.filterActive}
                    </button>
                    <button
                      onClick={() => setStatusFilter('blocked')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        statusFilter === 'blocked'
                          ? 'bg-[#F2431E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentTexts.filterBlocked}
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des demandes */}
              {loadingRequests ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noRequests}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {currentTexts.email}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {currentTexts.type}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {currentTexts.status}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {currentTexts.createdAt}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {currentTexts.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRequests.map((request) => (
                          <tr key={request.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="w-5 h-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {request.email || request.user_id.slice(0, 8) + '...'}
                                  </div>
                                  {request.first_name && request.last_name && (
                                    <div className="text-sm text-gray-500">
                                      {request.first_name} {request.last_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {request.pro_type ? getProTypeLabel(request.pro_type) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(request)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.created_at
                                ? new Date(request.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsDetailModalOpen(true);
                                }}
                                className="text-[#F2431E] hover:text-[#E63A1A] mr-4"
                              >
                                {currentTexts.viewDetails}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />

      {/* Modal détails */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentTexts.details}</DialogTitle>
            <DialogDescription>
              {selectedRequest?.email || selectedRequest?.user_id}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Informations utilisateur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{currentTexts.email}</label>
                  <p className="text-gray-900">{selectedRequest.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{currentTexts.phone}</label>
                  <p className="text-gray-900">{selectedRequest.phone || '-'}</p>
                </div>
                {selectedRequest.first_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nom complet</label>
                    <p className="text-gray-900">
                      {selectedRequest.first_name} {selectedRequest.last_name || ''}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">{currentTexts.status}</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest)}</div>
                </div>
              </div>

              {/* Informations Pro */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informations Pro</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {currentTexts.proType}
                    </label>
                    <p className="text-gray-900 mt-1">
                      {selectedRequest.pro_type ? getProTypeLabel(selectedRequest.pro_type) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {currentTexts.proUsage}
                    </label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                      {selectedRequest.pro_usage || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{currentTexts.createdAt}</label>
                    <p className="text-gray-900 mt-1">
                      {selectedRequest.created_at
                        ? new Date(selectedRequest.created_at).toLocaleString('fr-FR')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex gap-3">
                {selectedRequest.pro_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleActivate(selectedRequest.user_id)}
                      disabled={actionLoading === selectedRequest.user_id}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {actionLoading === selectedRequest.user_id ? '...' : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {currentTexts.activate}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedRequest.user_id)}
                      disabled={actionLoading === selectedRequest.user_id}
                      variant="outline"
                      className="flex-1"
                    >
                      {actionLoading === selectedRequest.user_id ? '...' : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          {currentTexts.reject}
                        </>
                      )}
                    </Button>
                  </>
                )}
                {selectedRequest.role === 'pro' && selectedRequest.pro_status === 'active' && (
                  <Button
                    onClick={() => handleBlock(selectedRequest.user_id)}
                    disabled={actionLoading === selectedRequest.user_id}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {actionLoading === selectedRequest.user_id ? '...' : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        {currentTexts.block}
                      </>
                    )}
                  </Button>
                )}
                {selectedRequest.pro_status === 'blocked' && (
                  <Button
                    onClick={() => handleActivate(selectedRequest.user_id)}
                    disabled={actionLoading === selectedRequest.user_id}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    {actionLoading === selectedRequest.user_id ? '...' : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {currentTexts.activate}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Modal */}
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
