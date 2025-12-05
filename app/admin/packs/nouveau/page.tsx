'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';

export default function NouveauPackPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nom_pack: '',
    prix_base_ttc: '',
    description_courte: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('packs')
        .insert({
          nom_pack: formData.nom_pack,
          prix_base_ttc: parseFloat(formData.prix_base_ttc),
          description_courte: formData.description_courte || null,
        });

      if (error) throw error;
      router.push('/admin/packs');
    } catch (error: any) {
      console.error('Erreur création pack:', error);
      alert(error.message || 'Erreur lors de la création du pack');
    } finally {
      setIsSubmitting(false);
    }
  };

  const texts = {
    fr: {
      title: 'Créer un pack',
      name: 'Nom du pack',
      price: 'Prix de base TTC (€)',
      description: 'Description courte',
      submit: 'Créer le pack',
      cancel: 'Annuler',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour créer un pack.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Create a pack',
      name: 'Pack name',
      price: 'Base price TTC (€)',
      description: 'Short description',
      submit: 'Create pack',
      cancel: 'Cancel',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to create a pack.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <AdminSidebar language={language} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader language={language} />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title}</h1>
              
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.name}</label>
                  <input
                    type="text"
                    required
                    value={formData.nom_pack}
                    onChange={(e) => setFormData({ ...formData, nom_pack: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.price}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.prix_base_ttc}
                    onChange={(e) => setFormData({ ...formData, prix_base_ttc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.description}</label>
                  <textarea
                    value={formData.description_courte}
                    onChange={(e) => setFormData({ ...formData, description_courte: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/packs')}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {currentTexts.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Création...' : currentTexts.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
    </div>
  );
}

