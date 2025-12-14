'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import SignModal from '@/components/auth/SignModal';
import DashboardSidebar from '@/components/DashboardSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// Icônes lucide-react
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Save,
  Trash2,
  AlertTriangle,
  Menu
} from 'lucide-react';

export default function MesInformationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { isCollapsed: isSidebarCollapsed, toggleSidebar: handleToggleSidebar } = useSidebarCollapse();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    company: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (loading) return; // Attendre que le chargement soit terminé
    
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    const loadProfile = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Charger ou créer le profil
        const { data, error } = await supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProfile(data);
          setFormData({
            phone: data.phone || '',
            address: data.address || '',
            company: data.company || '',
          });
        } else {
          // Créer un profil vide
          const { data: newProfile, error: createError } = await supabaseClient
            .from('user_profiles')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !supabase) return;

    const supabaseClient = supabase;
    if (!supabaseClient) return;

    setIsSaving(true);
    try {
      const { error } = await supabaseClient
        .from('user_profiles')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;

      alert(language === 'fr' ? 'Profil mis à jour avec succès' : 'Profile updated successfully');
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      alert(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !supabase) return;

    const supabaseClient = supabase;
    if (!supabaseClient) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Déconnexion et redirection
      await supabaseClient.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Erreur suppression compte:', error);
      alert(language === 'fr' 
        ? `Erreur lors de la suppression du compte: ${error.message || 'Erreur inconnue'}` 
        : `Error deleting account: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const texts = {
    fr: {
      title: 'Mes informations',
      email: 'Email',
      phone: 'Téléphone',
      address: 'Adresse',
      company: 'Entreprise',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      deleteAccount: 'Supprimer mon compte',
      deleteAccountConfirm: 'Confirmer la suppression',
      deleteAccountCancel: 'Annuler',
      deleteAccountWarning: 'Attention : Cette action est irréversible',
      deleteAccountDescription: 'En supprimant votre compte, toutes vos données personnelles seront définitivement supprimées, y compris : vos réservations, vos commandes, vos états des lieux, vos contrats et toutes vos informations. Cette action ne peut pas être annulée.',
      deleteAccountReservationsWarning: '⚠️ Si vous avez des réservations en cours, vous ne pourrez plus les retrouver après la suppression de votre compte.',
      deleteAccountConfirmText: 'Je comprends que cette action est irréversible et que toutes mes données, y compris mes réservations en cours, seront définitivement supprimées',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder à vos informations.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'My information',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      company: 'Company',
      save: 'Save',
      saving: 'Saving...',
      deleteAccount: 'Delete my account',
      deleteAccountConfirm: 'Confirm deletion',
      deleteAccountCancel: 'Cancel',
      deleteAccountWarning: 'Warning: This action is irreversible',
      deleteAccountDescription: 'By deleting your account, all your personal data will be permanently deleted, including: your reservations, orders, condition reports, contracts and all your information. This action cannot be undone.',
      deleteAccountReservationsWarning: '⚠️ If you have ongoing reservations, you will no longer be able to retrieve them after deleting your account.',
      deleteAccountConfirmText: 'I understand that this action is irreversible and that all my data, including my ongoing reservations, will be permanently deleted',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access your information.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
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
        </div>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        {/* Sidebar */}
        <DashboardSidebar 
          language={language}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
        <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{currentTexts.title}</h1>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'fr' ? 'Informations personnelles' : 'Personal information'}</CardTitle>
              <CardDescription>{language === 'fr' ? 'Gérez vos informations de contact' : 'Manage your contact information'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{currentTexts.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="pl-10 bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500">{language === 'fr' ? 'L\'email ne peut pas être modifié' : 'Email cannot be modified'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{currentTexts.phone}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{currentTexts.address}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none resize-none"
                    placeholder={language === 'fr' ? 'Votre adresse complète' : 'Your complete address'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{currentTexts.company}</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10"
                    placeholder={language === 'fr' ? 'Nom de votre entreprise (optionnel)' : 'Your company name (optional)'}
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? currentTexts.saving : currentTexts.save}
              </Button>
            </CardContent>
          </Card>

          {/* Section suppression de compte */}
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {currentTexts.deleteAccountWarning}
              </CardTitle>
              <CardDescription className="text-red-700">
                {currentTexts.deleteAccountDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setConfirmDeleteChecked(false);
                }}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {currentTexts.deleteAccount}
              </Button>
            </CardContent>
          </Card>

          {/* Dialog de confirmation */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  {currentTexts.deleteAccountWarning}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700 font-medium">{currentTexts.deleteAccountDescription}</p>
                  <p className="text-sm text-red-700 font-semibold">{currentTexts.deleteAccountReservationsWarning}</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmDeleteChecked}
                    onChange={(e) => setConfirmDeleteChecked(e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{currentTexts.deleteAccountConfirmText}</span>
                </label>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmDeleteChecked(false);
                    }}
                    disabled={isDeleting}
                  >
                    {currentTexts.deleteAccountCancel}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !confirmDeleteChecked}
                  >
                    {isDeleting ? (language === 'fr' ? 'Suppression...' : 'Deleting...') : currentTexts.deleteAccountConfirm}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
      />
      </div>
      <Footer language={language} />
    </div>
  );
}

