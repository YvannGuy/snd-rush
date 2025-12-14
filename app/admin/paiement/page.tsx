'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Send, Loader2 } from 'lucide-react';

interface CustomProduct {
  id: string;
  name: string;
  price: number;
}

export default function AdminPaiementPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState('');
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const texts = {
    fr: {
      title: 'Créer un lien de paiement',
      subtitle: 'Générer un lien Stripe pour la caution et envoyer un email au client',
      customerInfo: 'Informations client',
      customerName: 'Nom complet',
      customerEmail: 'Adresse email',
      eventAddress: 'Adresse de l\'événement',
      depositAmount: 'Caution remboursable (€)',
      dates: 'Dates et heures',
      startDate: 'Date de début',
      startTime: 'Heure de début',
      endDate: 'Date de fin',
      endTime: 'Heure de fin',
      participants: 'Nombre de participants',
      customProducts: 'Produits personnalisés',
      productName: 'Nom du produit',
      productPrice: 'Prix (€)',
      addProduct: 'Ajouter',
      send: 'Envoyer',
      sending: 'Envoi en cours...',
      success: 'Paiement réussi !',
      successMessage: 'Le client a été redirigé vers Stripe et le paiement a été effectué avec succès.',
      cancelled: 'Paiement annulé',
      cancelledMessage: 'Le client a annulé le paiement.',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder à cette page.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Create payment link',
      subtitle: 'Generate a Stripe link for deposit and send email to client',
      customerInfo: 'Client information',
      customerName: 'Full name',
      customerEmail: 'Email address',
      eventAddress: 'Event address',
      depositAmount: 'Refundable deposit (€)',
      dates: 'Dates and times',
      startDate: 'Start date',
      startTime: 'Start time',
      endDate: 'End date',
      endTime: 'End time',
      participants: 'Number of participants',
      customProducts: 'Custom products',
      productName: 'Product name',
      productPrice: 'Price (€)',
      addProduct: 'Add',
      send: 'Send',
      sending: 'Sending...',
      success: 'Payment successful!',
      successMessage: 'The client has been redirected to Stripe and the payment was completed successfully.',
      cancelled: 'Payment cancelled',
      cancelledMessage: 'The client cancelled the payment.',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access this page.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  const addProduct = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) return;
    
    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price <= 0) return;

    setCustomProducts([
      ...customProducts,
      {
        id: Date.now().toString(),
        name: newProductName.trim(),
        price: price,
      },
    ]);
    setNewProductName('');
    setNewProductPrice('');
  };

  const removeProduct = (id: string) => {
    setCustomProducts(customProducts.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerEmail || !eventAddress || !depositAmount || !startDate || !startTime || !endDate || !endTime) {
      alert(language === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill all required fields');
      return;
    }

    const deposit = parseFloat(depositAmount);
    if (isNaN(deposit) || deposit <= 0) {
      alert(language === 'fr' ? 'La caution doit être un montant valide' : 'Deposit must be a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          eventAddress,
          depositAmount: deposit,
          startDate,
          startTime,
          endDate,
          endTime,
          participants: participants ? parseInt(participants) : null,
          customProducts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      alert(language === 'fr' 
        ? 'Email envoyé avec succès au client !' 
        : 'Email sent successfully to client!');
      
      // Réinitialiser le formulaire
      setCustomerName('');
      setCustomerEmail('');
      setEventAddress('');
      setDepositAmount('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setParticipants('');
      setCustomProducts([]);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(language === 'fr' 
        ? `Erreur: ${error.message}` 
        : `Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier les paramètres d'URL pour afficher les messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        setShowSuccess(true);
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/admin/paiement');
        // Masquer le message après 5 secondes
        setTimeout(() => setShowSuccess(false), 5000);
      }
      if (params.get('cancelled') === 'true') {
        setShowCancelled(true);
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/admin/paiement');
        // Masquer le message après 5 secondes
        setTimeout(() => setShowCancelled(false), 5000);
      }
    }
  }, []);

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

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
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {currentTexts.title}
                </h1>
                <p className="text-gray-600">{currentTexts.subtitle}</p>
              </div>

              {/* Message de succès */}
              {showSuccess && (
                <Card className="mb-6 border-green-500 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-900">{currentTexts.success}</h3>
                        <p className="text-sm text-green-700">{currentTexts.successMessage}</p>
                      </div>
                      <button
                        onClick={() => setShowSuccess(false)}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Message d'annulation */}
              {showCancelled && (
                <Card className="mb-6 border-orange-500 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <X className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-900">{currentTexts.cancelled}</h3>
                        <p className="text-sm text-orange-700">{currentTexts.cancelledMessage}</p>
                      </div>
                      <button
                        onClick={() => setShowCancelled(false)}
                        className="text-orange-700 hover:text-orange-900"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{currentTexts.customerInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">{currentTexts.customerName} *</Label>
                      <Input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">{currentTexts.customerEmail} *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventAddress">{currentTexts.eventAddress} *</Label>
                      <Input
                        id="eventAddress"
                        type="text"
                        value={eventAddress}
                        onChange={(e) => setEventAddress(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="depositAmount">{currentTexts.depositAmount} *</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{currentTexts.dates}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">{currentTexts.startDate} *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime">{currentTexts.startTime} *</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">{currentTexts.endDate} *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">{currentTexts.endTime} *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="participants">{currentTexts.participants}</Label>
                      <Input
                        id="participants"
                        type="number"
                        min="1"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{currentTexts.customProducts}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="newProductName">{currentTexts.productName}</Label>
                        <Input
                          id="newProductName"
                          type="text"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="mt-1"
                          placeholder={currentTexts.productName}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newProductPrice">{currentTexts.productPrice}</Label>
                        <Input
                          id="newProductPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addProduct}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {currentTexts.addProduct}
                    </Button>

                    {customProducts.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {customProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.price.toFixed(2)}€</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {currentTexts.sending}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {currentTexts.send}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />
    </div>
  );
}
