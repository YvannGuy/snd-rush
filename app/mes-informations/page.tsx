'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MesInformationsPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
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
      deleteAccountDescription: 'En supprimant votre compte, toutes vos données personnelles seront définitivement supprimées. Cette action ne peut pas être annulée.',
      deleteAccountConfirmText: 'Je comprends et souhaite supprimer mon compte',
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
      deleteAccountDescription: 'By deleting your account, all your personal data will be permanently deleted. This action cannot be undone.',
      deleteAccountConfirmText: 'I understand and wish to delete my account',
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar language={language} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{currentTexts.title}</h1>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.email}
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.address}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none"
                  placeholder="Votre adresse complète"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.company}
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none"
                  placeholder="Nom de votre entreprise (optionnel)"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#F2431E] text-white py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? currentTexts.saving : currentTexts.save}
              </button>
            </div>
          </div>

          {/* Section suppression de compte */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-900 mb-2">{currentTexts.deleteAccountWarning}</h3>
              <p className="text-sm text-red-700 mb-4">{currentTexts.deleteAccountDescription}</p>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setConfirmDeleteChecked(false);
                }}
                disabled={isDeleting}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentTexts.deleteAccount}
              </button>
            </div>
          </div>

          {/* Modal de confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentTexts.deleteAccountWarning}</h3>
                  <p className="text-gray-600 mb-4">{currentTexts.deleteAccountDescription}</p>
                </div>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDeleteChecked}
                      onChange={(e) => setConfirmDeleteChecked(e.target.checked)}
                      className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{currentTexts.deleteAccountConfirmText}</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setConfirmDeleteChecked(false);
                      }}
                      disabled={isDeleting}
                      className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      {currentTexts.deleteAccountCancel}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !confirmDeleteChecked}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (language === 'fr' ? 'Suppression...' : 'Deleting...') : currentTexts.deleteAccountConfirm}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
      />
    </div>
  );
}

