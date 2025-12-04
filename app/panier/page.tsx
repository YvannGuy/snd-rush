'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type DeliveryOption = 'paris' | 'petite_couronne' | 'grande_couronne' | 'retrait';

interface DeliveryOptionType {
  id: DeliveryOption;
  name: string;
  price: number;
}

export default function CartPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('paris');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCart();

  const deliveryOptions: Record<DeliveryOption, DeliveryOptionType> = {
    paris: { id: 'paris', name: language === 'fr' ? 'Paris (75)' : 'Paris (75)', price: 0 },
    petite_couronne: { id: 'petite_couronne', name: language === 'fr' ? 'Petite Couronne (92, 93, 94)' : 'Inner suburbs (92, 93, 94)', price: 30 },
    grande_couronne: { id: 'grande_couronne', name: language === 'fr' ? 'Grande Couronne (77, 78, 91, 95)' : 'Outer suburbs (77, 78, 91, 95)', price: 60 },
    retrait: { id: 'retrait', name: language === 'fr' ? 'Retrait sur place' : 'Pickup', price: 0 },
  };

  const deliveryFee = deliveryOptions[deliveryOption].price;
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
      checkout: 'Passer la commande',
      checkoutStripe: 'Payer avec Stripe',
      remove: 'Retirer',
      continue: 'Continuer les achats',
      clear: 'Vider le panier',
      quantity: 'Quantité',
      days: 'jours',
      options: 'Options',
      dates: 'Dates',
      selectDelivery: 'Sélectionner la livraison',
      processing: 'Traitement...',
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
      checkout: 'Checkout',
      checkoutStripe: 'Pay with Stripe',
      remove: 'Remove',
      continue: 'Continue shopping',
      clear: 'Clear cart',
      quantity: 'Quantity',
      days: 'days',
      options: 'Options',
      dates: 'Dates',
      selectDelivery: 'Select delivery',
      processing: 'Processing...',
    },
  };

  const currentTexts = texts[language];

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // Préparer les données pour Stripe
      const lineItems = cart.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: Math.round((item.dailyPrice * item.rentalDays + item.addons.reduce((sum, a) => sum + a.price, 0)) * 100), // En centimes
      }));

      // Ajouter les frais de livraison si nécessaire
      if (deliveryFee > 0) {
        lineItems.push({
          name: deliveryOptions[deliveryOption].name,
          quantity: 1,
          price: Math.round(deliveryFee * 100),
        });
      }

      // Appeler l'API Stripe
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: lineItems,
          total: totalWithDelivery,
          deliveryFee,
          deliveryOption: deliveryOptions[deliveryOption].name,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const data = await response.json();
      
      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      alert(language === 'fr' ? 'Erreur lors du paiement. Veuillez réessayer.' : 'Payment error. Please try again.');
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.title}</h1>
            <p className="text-xl text-gray-600 mb-2">{currentTexts.empty}</p>
            <p className="text-gray-500 mb-8">{currentTexts.emptyDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/packs"
                className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
              >
                {currentTexts.explorePacks}
              </Link>
              <Link
                href="/catalogue"
                className="inline-block border-2 border-[#F2431E] text-[#F2431E] px-8 py-4 rounded-xl font-bold hover:bg-[#F2431E]/10 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-black">{currentTexts.title}</h1>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              {currentTexts.clear}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des produits */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, index) => {
                const itemTotal = item.dailyPrice * item.quantity * item.rentalDays + 
                  item.addons.reduce((sum, addon) => sum + addon.price, 0);
                
                return (
                  <div
                    key={`${item.productId}-${item.startDate}-${item.endDate}-${index}`}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {item.images && item.images.length > 0 && (
                        <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-black mb-3">{item.productName}</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-4">
                            <span>{currentTexts.quantity}:</span>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                              <button
                                onClick={() => decreaseQuantity(item.productId)}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors font-semibold"
                              >
                                −
                              </button>
                              <span className="px-4 py-1 font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => increaseQuantity(item.productId)}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors font-semibold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p>{currentTexts.days}: {item.rentalDays}</p>
                          <p>{currentTexts.dates}: {item.startDate} → {item.endDate}</p>
                          {item.addons.length > 0 && (
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">{currentTexts.options}:</p>
                              <ul className="list-disc list-inside ml-4 space-y-1">
                                {item.addons.map((addon) => (
                                  <li key={addon.id} className="text-gray-600">
                                    {addon.name} (+{addon.price}€)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between sm:items-end">
                        <div className="text-right mb-4">
                          <div className="text-2xl font-bold text-black mb-1">
                            {itemTotal.toFixed(2)}€
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.dailyPrice}€ × {item.quantity} × {item.rentalDays} {currentTexts.days}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
                        >
                          {currentTexts.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Résumé */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-black mb-6">{currentTexts.title}</h2>
                
                {/* Sélecteur de livraison */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {currentTexts.selectDelivery}
                  </label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F2431E] focus:outline-none font-medium"
                  >
                    {Object.values(deliveryOptions).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} {option.price > 0 ? `(+${option.price}€)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Résumé des prix */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>{currentTexts.subtotal}</span>
                    <span className="font-semibold text-black">{cart.total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{currentTexts.delivery}</span>
                    <span className="font-semibold text-black">
                      {deliveryFee > 0 ? `+${deliveryFee.toFixed(2)}€` : 'Gratuit'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 pt-2">
                    <span>{currentTexts.deposit}</span>
                    <span>{cart.depositTotal.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                  <span className="text-xl font-bold text-black">{currentTexts.total}</span>
                  <span className="text-2xl font-bold text-[#F2431E]">{totalWithDelivery.toFixed(2)}€</span>
                </div>

                {/* Boutons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-[#F2431E] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isProcessing ? currentTexts.processing : currentTexts.checkoutStripe}
                  </button>
                  <Link
                    href="/catalogue"
                    className="block w-full text-center border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-[#F2431E] hover:text-[#F2431E] transition-colors"
                  >
                    {currentTexts.continue}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
