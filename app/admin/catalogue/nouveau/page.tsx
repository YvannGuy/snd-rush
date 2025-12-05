'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SignModal from '@/components/auth/SignModal';

export default function NouveauProduitPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    long_description: '',
    daily_price_ttc: '',
    deposit: '',
    quantity: '1',
    category: '',
    tags: '',
    images: '',
    features: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const imagesArray = formData.images.split(',').map(i => i.trim()).filter(i => i);
      const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          long_description: formData.long_description || null,
          daily_price_ttc: parseFloat(formData.daily_price_ttc),
          deposit: parseFloat(formData.deposit) || 0,
          quantity: parseInt(formData.quantity) || 1,
          category: formData.category || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          images: imagesArray.length > 0 ? imagesArray : null,
          features: featuresArray.length > 0 ? featuresArray : null,
        });

      if (error) throw error;
      router.push('/admin/catalogue');
    } catch (error: any) {
      console.error('Erreur création produit:', error);
      alert(error.message || 'Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const texts = {
    fr: {
      title: 'Ajouter un produit',
      name: 'Nom du produit',
      slug: 'Slug (URL)',
      description: 'Description courte',
      longDescription: 'Description longue',
      dailyPrice: 'Prix journalier TTC (€)',
      deposit: 'Caution (€)',
      quantity: 'Quantité disponible',
      category: 'Catégorie',
      tags: 'Tags (séparés par des virgules)',
      images: 'Images (URLs séparées par des virgules)',
      features: 'Caractéristiques (séparées par des virgules)',
      submit: 'Créer le produit',
      cancel: 'Annuler',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour ajouter un produit.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Add a product',
      name: 'Product name',
      slug: 'Slug (URL)',
      description: 'Short description',
      longDescription: 'Long description',
      dailyPrice: 'Daily price TTC (€)',
      deposit: 'Deposit (€)',
      quantity: 'Available quantity',
      category: 'Category',
      tags: 'Tags (comma separated)',
      images: 'Images (URLs comma separated)',
      features: 'Features (comma separated)',
      submit: 'Create product',
      cancel: 'Cancel',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to add a product.',
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.slug}</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="ex: enceinte-active-15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.longDescription}</label>
                  <textarea
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.dailyPrice}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.daily_price_ttc}
                      onChange={(e) => setFormData({ ...formData, daily_price_ttc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.deposit}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.quantity}</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.category}</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.tags}</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="ex: Puissante, Indoor/Outdoor, Pro Quality"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.images}</label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="ex: /image1.jpg, /image2.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{currentTexts.features}</label>
                  <input
                    type="text"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                    placeholder="ex: 800W RMS, 15-inch woofer, Bluetooth"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/catalogue')}
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

