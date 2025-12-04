'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import Image from 'next/image';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { CartItem } from '@/types/db';

type DeliveryOption = 'paris' | 'petite_couronne' | 'grande_couronne' | 'retrait';

interface DeliveryOptionType {
  id: DeliveryOption;
  name: string;
  price: number;
}

export default function CartPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, addToCart } = useCart();
  const { user } = useUser();

  // Pré-remplir l'email avec celui de l'utilisateur connecté
  useEffect(() => {
    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
  }, [user, customerEmail]);

  const deliveryOptions: Record<DeliveryOption, DeliveryOptionType> = {
    paris: { id: 'paris', name: language === 'fr' ? 'Paris' : 'Paris', price: 80 },
    petite_couronne: { id: 'petite_couronne', name: language === 'fr' ? 'Petite Couronne' : 'Inner suburbs', price: 120 },
    grande_couronne: { id: 'grande_couronne', name: language === 'fr' ? 'Grande Couronne' : 'Outer suburbs', price: 160 },
    retrait: { id: 'retrait', name: language === 'fr' ? 'Retrait' : 'Pickup', price: 0 },
  };

  const deliveryFee = deliveryOption ? deliveryOptions[deliveryOption].price : 0;
  const totalWithDelivery = cart.total + deliveryFee;

  const texts = {
    fr: {
      title: 'Panier',
      empty: 'Votre panier est vide',
      emptyDescription: 'Explorez nos packs et notre catalogue pour trouver ce dont vous avez besoin.',
      explorePacks: 'Voir les packs',
      exploreProducts: 'Voir le catalogue',
      subtotal: 'Sous-total',
      delivery: 'Livraison',
      total: 'Total',
      deposit: 'Dépôt total',
      checkout: 'Créer un compte et payer',
      checkoutStripe: 'Passer la commande',
      acceptTermsText: 'J\'accepte les',
      rentalConditions: 'conditions de location',
      remove: 'Retirer',
      continue: 'Continuer les achats',
      clear: 'Vider le panier',
      quantity: 'Quantité',
      days: 'jours',
      options: 'Options',
      dates: 'Dates',
      selectDelivery: 'Zone de livraison',
      processing: 'Traitement...',
      customerEmail: 'Email',
      customerName: 'Nom complet',
      deliveryAddress: 'Adresse de livraison',
      requiredFields: 'Veuillez remplir tous les champs requis.',
      deliveryDetails: 'Détails de livraison',
      parisPrice: '40€ aller + 40€ retour',
      petitePrice: '60€ aller + 60€ retour',
      grandePrice: '80€ aller + 80€ retour',
      sndRush: 'SND Rush',
      deliveryInfo: 'Livraison Île-de-France 24/7',
      emergency: 'Service d\'urgence disponible',
      securePayment: 'Paiement sécurisé',
    },
    en: {
      title: 'Cart',
      empty: 'Your cart is empty',
      emptyDescription: 'Explore our packs and catalog to find what you need.',
      explorePacks: 'View packs',
      exploreProducts: 'View catalog',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      deposit: 'Total deposit',
      checkout: 'Create account and pay',
      checkoutStripe: 'Checkout',
      acceptTermsText: 'I accept the',
      rentalConditions: 'rental conditions',
      remove: 'Remove',
      continue: 'Continue shopping',
      clear: 'Clear cart',
      quantity: 'Quantity',
      days: 'days',
      options: 'Options',
      dates: 'Dates',
      selectDelivery: 'Delivery zone',
      processing: 'Processing...',
      customerEmail: 'Email',
      customerName: 'Full name',
      deliveryAddress: 'Delivery address',
      requiredFields: 'Please fill in all required fields.',
      deliveryDetails: 'Delivery details',
      parisPrice: '40€ out + 40€ return',
      petitePrice: '60€ out + 60€ return',
      grandePrice: '80€ out + 80€ return',
      sndRush: 'SND Rush',
      deliveryInfo: 'Île-de-France delivery 24/7',
      emergency: 'Emergency service available',
      securePayment: 'Secure payment',
    },
  };

  const currentTexts = texts[language];

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;

    // Vérifier que les champs requis sont remplis
    if (!customerEmail || !customerName) {
      alert(currentTexts.requiredFields);
      return;
    }

    // Si l'utilisateur n'est pas connecté, ouvrir le modal de connexion
    if (!user) {
      setPendingCheckout(true);
      setIsSignModalOpen(true);
      return;
    }

    // Utiliser "retrait" par défaut si aucune option de livraison n'est sélectionnée
    const finalDeliveryOption = deliveryOption || 'retrait';

    if (!acceptTerms) {
      alert(language === 'fr' 
        ? 'Veuillez accepter les conditions de location.' 
        : 'Please accept the rental conditions.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Calculer les totaux
      const deliveryFee = finalDeliveryOption ? deliveryOptions[finalDeliveryOption].price : 0;
      const total = cart.total;
      const depositTotal = cart.depositTotal;

      // Préparer les items pour Stripe (format requis)
      const items = cart.items.map(item => {
        const itemTotal = item.dailyPrice * item.quantity * item.rentalDays;
        const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0);
        return {
          name: item.productName,
          quantity: item.quantity,
          price: Math.round((itemTotal + addonsTotal) * 100), // En centimes
        };
      });

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id, // Envoyer l'ID de l'utilisateur connecté
          cartItems: cart.items, // Utiliser cartItems pour le webhook
          items, // Format Stripe
          total,
          depositTotal,
          deliveryFee,
          deliveryOption: finalDeliveryOption,
          customerEmail,
          customerName,
          address: finalDeliveryOption !== 'retrait' ? customerAddress : '',
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }
    } catch (error: any) {
      console.error('Erreur checkout:', error);
      alert(language === 'fr' 
        ? 'Erreur lors du paiement. Veuillez réessayer.' 
        : 'Payment error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignInSuccess = () => {
    setIsSignModalOpen(false);
    if (pendingCheckout) {
      setPendingCheckout(false);
      // Recharger la page pour que useUser récupère le nouvel utilisateur
      window.location.reload();
    }
  };

  // Handler pour ajouter un produit supplémentaire
  const handleAddAdditionalProduct = (productName: string, dailyPrice: number, productId: string) => {
    // Utiliser les dates du premier item du panier, ou dates par défaut
    const firstItem = cart.items[0];
    const startDate = firstItem?.startDate || new Date().toISOString().split('T')[0];
    const endDate = firstItem?.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const rentalDays = firstItem?.rentalDays || 1;

    const cartItem: CartItem = {
      productId,
      productName,
      productSlug: productId,
      quantity: 1,
      rentalDays,
      startDate,
      endDate,
      dailyPrice,
      deposit: 0,
      addons: [],
      images: [],
    };

    addToCart(cartItem);
    // Pas de message de confirmation ni d'ouverture du dropdown sur la page panier
  };

  // Handler pour demander une installation
  const handleRequestInstallation = () => {
    if (language === 'fr') {
      alert('Merci pour votre demande ! Nous vous contacterons sous peu pour discuter de vos besoins en installation.');
    } else {
      alert('Thank you for your request! We will contact you shortly to discuss your installation needs.');
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{currentTexts.empty}</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{currentTexts.emptyDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/packs"
                className="px-6 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.explorePacks}
              </Link>
              <Link
                href="/catalogue"
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:border-[#F2431E] hover:text-[#F2431E] transition-colors"
              >
                {currentTexts.exploreProducts}
              </Link>
            </div>
          </div>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header épuré */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{currentTexts.title}</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {cart.items.length} {cart.items.length === 1 ? (language === 'fr' ? 'article' : 'item') : (language === 'fr' ? 'articles' : 'items')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Liste des produits - Design épuré */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, index) => {
                const itemTotal = item.dailyPrice * item.quantity * item.rentalDays + 
                  item.addons.reduce((sum, addon) => sum + addon.price, 0);
                
                return (
                  <div
                    key={`${item.productId}-${item.startDate}-${item.endDate}-${index}`}
                    className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {/* Image */}
                      {item.images && item.images.length > 0 ? (
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            priority
                          />
                        </div>
                      ) : (
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{item.productName}</h3>
                            <p className="text-sm text-gray-500">{item.startDate} → {item.endDate}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl sm:text-2xl font-bold text-[#F2431E] mb-1">
                              {itemTotal.toFixed(2)}€
                            </div>
                            <p className="text-xs text-gray-500">
                              {item.dailyPrice}€ × {item.quantity} × {item.rentalDays} {currentTexts.days}
                            </p>
                          </div>
                        </div>
                        
                        {/* Quantité et options */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{currentTexts.quantity}:</span>
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => decreaseQuantity(item.productId, item.startDate, item.endDate)}
                                className="px-3 py-1.5 hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                              >
                                −
                              </button>
                              <span className="px-4 py-1.5 font-semibold text-gray-900 min-w-[3rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => increaseQuantity(item.productId, item.startDate, item.endDate)}
                                className="px-3 py-1.5 hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {item.addons.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-600">{currentTexts.options}:</span>
                                {item.addons.map((addon) => (
                                <span key={addon.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {addon.name} (+{addon.price}€)
                                </span>
                                ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Bouton retirer */}
                        <button
                          onClick={() => removeFromCart(item.productId, item.startDate, item.endDate)}
                          className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          {currentTexts.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Section Achats additionnels */}
              <div className="mt-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {language === 'fr' ? 'Vous souhaitez peut-être ajouter...' : 'You might want to add...'}
                </h2>
                <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-3 min-w-max">
                    {/* Carte Livraison - Très compacte */}
                    <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 w-[130px] flex-shrink-0 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="w-4 h-4 bg-[#F2431E]/10 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2 h-2 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-[9px] text-gray-900">{language === 'fr' ? 'Livraison' : 'Delivery'}</h3>
                      </div>
                      <div className="space-y-0.5">
                        {Object.values(deliveryOptions).map((option) => {
                          const isSelected = deliveryOption === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setDeliveryOption(option.id)}
                              className={`w-full text-left px-1 py-0.5 rounded transition-all ${
                                isSelected
                                  ? 'bg-[#F2431E]/10 border border-[#F2431E]'
                                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-0.5">
                                <span className={`font-medium truncate text-[8px] leading-tight ${isSelected ? 'text-[#F2431E]' : 'text-gray-700'}`}>
                                  {option.name}
                                </span>
                                <span className={`font-bold flex-shrink-0 text-[8px] ${isSelected ? 'text-[#F2431E]' : option.id === 'retrait' ? 'text-green-600' : 'text-gray-700'}`}>
                                  {option.price > 0 ? `${option.price}€` : language === 'fr' ? 'Gratuit' : 'Free'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Carte Installation - Compacte */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[200px] hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Installation' : 'Installation'}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {language === 'fr' 
                          ? 'Installation par technicien'
                          : 'Installation by technician'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {language === 'fr' ? 'Sur devis' : 'On quote'}
                        </span>
                        <button 
                          onClick={handleRequestInstallation}
                          className="px-3 py-1.5 bg-[#F2431E] text-white rounded-md font-medium hover:bg-[#E63A1A] transition-colors text-xs"
                        >
                          {language === 'fr' ? 'Demander' : 'Request'}
                        </button>
                      </div>
                    </div>

                    {/* Carte Produit exemple 1 - Compacte */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[180px] hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100 mb-2">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{language === 'fr' ? 'Micro sans fil' : 'Wireless mic'}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-[#F2431E]">30€/j</span>
                        <button 
                          onClick={() => handleAddAdditionalProduct(
                            language === 'fr' ? 'Micro sans fil' : 'Wireless microphone',
                            30,
                            'micro-sans-fil'
                          )}
                          className="px-3 py-1 bg-[#F2431E] text-white rounded-md font-medium hover:bg-[#E63A1A] transition-colors text-xs"
                        >
                          {language === 'fr' ? 'Ajouter' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Carte Produit exemple 2 - Compacte */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[180px] hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100 mb-2">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{language === 'fr' ? 'Éclairage LED' : 'LED lighting'}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-[#F2431E]">50€/j</span>
                        <button 
                          onClick={() => handleAddAdditionalProduct(
                            language === 'fr' ? 'Éclairage LED' : 'LED lighting',
                            50,
                            'eclairage-led'
                          )}
                          className="px-3 py-1 bg-[#F2431E] text-white rounded-md font-medium hover:bg-[#E63A1A] transition-colors text-xs"
                        >
                          {language === 'fr' ? 'Ajouter' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Carte Produit exemple 3 - Compacte */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[180px] hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100 mb-2">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{language === 'fr' ? 'Câbles audio' : 'Audio cables'}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-[#F2431E]">20€/j</span>
                        <button 
                          onClick={() => handleAddAdditionalProduct(
                            language === 'fr' ? 'Câbles audio' : 'Audio cables',
                            20,
                            'cables-audio'
                          )}
                          className="px-3 py-1 bg-[#F2431E] text-white rounded-md font-medium hover:bg-[#E63A1A] transition-colors text-xs"
                        >
                          {language === 'fr' ? 'Ajouter' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé - Design moderne et épuré */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                {/* Informations SND Rush */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                    <span className="font-bold text-gray-900">{currentTexts.sndRush}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{currentTexts.deliveryInfo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{currentTexts.emergency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{currentTexts.securePayment}</span>
                    </div>
                  </div>
                </div>

                {/* Résumé des prix */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>{currentTexts.subtotal}</span>
                    <span className="font-semibold text-gray-900">{cart.total.toFixed(2)}€</span>
                  </div>
                  
                  {deliveryOption && (
                    <div className="flex justify-between text-gray-600">
                      <span>{currentTexts.delivery}</span>
                      <span className="font-semibold text-gray-900">
                        {deliveryOptions[deliveryOption].price > 0 ? `+${deliveryOptions[deliveryOption].price}€` : language === 'fr' ? 'Gratuit' : 'Free'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>{currentTexts.deposit}</span>
                    <span>{cart.depositTotal.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 pb-6 border-t border-gray-200 pt-4">
                  <span className="text-lg font-bold text-gray-900">{currentTexts.total}</span>
                  <span className="text-2xl font-bold text-[#F2431E]">{totalWithDelivery.toFixed(2)}€</span>
                </div>

                {/* Informations client */}
                  <div className="mb-6 space-y-4">
                    <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                        {currentTexts.customerEmail} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-[#F2431E] focus:ring-1 focus:ring-[#F2431E] focus:outline-none transition-colors"
                        placeholder="votre@email.com"
                      disabled={!!user?.email}
                      />
                    </div>
                    <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        {currentTexts.customerName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-[#F2431E] focus:ring-1 focus:ring-[#F2431E] focus:outline-none transition-colors"
                        placeholder={language === 'fr' ? 'Votre nom complet' : 'Your full name'}
                      />
                    </div>
                  {deliveryOption && deliveryOption !== 'retrait' && (
                      <div>
                      <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                          {currentTexts.deliveryAddress}
                        </label>
                      <AddressAutocomplete
                          id="customerAddress"
                          value={customerAddress}
                        onChange={setCustomerAddress}
                        placeholder={language === 'fr' ? 'Commencez à taper une adresse...' : 'Start typing an address...'}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-[#F2431E] focus:ring-1 focus:ring-[#F2431E] focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>

                {/* Case à cocher conditions */}
                {user && (
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-[#F2431E] border-gray-300 rounded focus:ring-[#F2431E] focus:ring-2 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        {currentTexts.acceptTermsText}{' '}
                        <Link
                          href="/cgv"
                          className="text-[#F2431E] hover:underline font-semibold"
                          target="_blank"
                        >
                          {currentTexts.rentalConditions}
                        </Link>
                      </span>
                    </label>
                  </div>
                )}

                {/* Bouton checkout - Toujours actif */}
                  <button
                    onClick={handleCheckout}
                  disabled={isProcessing || !customerEmail || !customerName || (user ? !acceptTerms : false)}
                  className="w-full bg-[#F2431E] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#E63A1A] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{currentTexts.processing}</span>
                    </>
                  ) : !user ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>{currentTexts.checkout}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15l1-4m4 4l1-4m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{currentTexts.checkoutStripe}</span>
                    </>
                  )}
                  </button>
                  
                  {/* Moyens de paiement acceptés */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      {language === 'fr' ? 'Plusieurs moyens de paiement possibles' : 'Multiple payment methods available'}
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      
      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => {
          setIsSignModalOpen(false);
          setPendingCheckout(false);
        }}
        prefillEmail={customerEmail || undefined}
        language={language}
        onSuccess={handleSignInSuccess}
        initialTab="signup"
      />
    </div>
  );
}
