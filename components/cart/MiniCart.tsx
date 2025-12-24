'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
}

export default function MiniCart({ isOpen, onClose, language }: MiniCartProps) {
  const { cart, removeFromCart, updateCartItem, increaseQuantity, decreaseQuantity, clearCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const texts = {
    fr: {
      title: 'Panier',
      empty: 'Votre panier est vide',
      emptyDescription: 'Explorez nos packs et notre catalogue pour trouver ce dont vous avez besoin.',
      explorePacks: 'Voir les packs',
      exploreProducts: 'Voir le catalogue',
      subtotal: 'Sous-total',
      viewCart: 'Voir le panier',
      checkout: 'Passer la commande',
      remove: 'Retirer',
      clear: 'Vider le panier',
      needQuote: 'Besoin d\'un devis sur mesure ou livraison urgente ?',
      contactUs: 'Contactez-nous',
      whatsapp: 'WhatsApp',
      call: 'Appeler',
    },
    en: {
      title: 'Cart',
      empty: 'Your cart is empty',
      emptyDescription: 'Explore our packs and catalog to find what you need.',
      explorePacks: 'View packs',
      exploreProducts: 'View catalog',
      subtotal: 'Subtotal',
      viewCart: 'View cart',
      checkout: 'Checkout',
      remove: 'Remove',
      clear: 'Clear cart',
      needQuote: 'Need a custom quote or urgent delivery?',
      contactUs: 'Contact us',
      whatsapp: 'WhatsApp',
      call: 'Call',
    },
  };

  const currentTexts = texts[language];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Cart Drawer/Dropdown */}
      <div
        ref={cartRef}
        className={`fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isMobile
            ? `top-16 right-4 w-[calc(100vw-2rem)] max-w-sm max-h-[80vh] rounded-xl border border-gray-200 flex flex-col ${
                isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
              }`
            : `top-16 right-4 lg:right-[max(1rem,calc((100vw-1280px)/2+2rem))] w-80 max-h-[80vh] rounded-xl border border-gray-200 flex flex-col ${
                isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
              }`
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-black">{currentTexts.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-base font-semibold text-gray-900 mb-2">{currentTexts.empty}</p>
              <p className="text-xs text-gray-600 mb-4">{currentTexts.emptyDescription}</p>
              <div className="space-y-2">
                <Link
                  href="/packs"
                  onClick={onClose}
                  className="block w-full bg-[#F2431E] text-white py-2.5 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm"
                >
                  {currentTexts.explorePacks}
                </Link>
                <Link
                  href="/catalogue"
                  onClick={onClose}
                  className="block w-full border-2 border-[#F2431E] text-[#F2431E] py-2.5 rounded-lg font-semibold hover:bg-[#F2431E]/10 transition-colors text-sm"
                >
                  {currentTexts.exploreProducts}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item, index) => {
                const addonsTotal = (item.addons && Array.isArray(item.addons))
                  ? item.addons.reduce((sum, addon) => {
                      const addonPrice = typeof addon.price === 'number' ? addon.price : 0;
                      return sum + addonPrice;
                    }, 0)
                  : 0;
                const dailyPrice = typeof item.dailyPrice === 'number' ? item.dailyPrice : 0;
                const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                const rentalDays = typeof item.rentalDays === 'number' ? item.rentalDays : 1;
                const itemTotal = dailyPrice * quantity * rentalDays + addonsTotal;
                
                return (
                  <div
                    key={`${item.productId}-${item.startDate}-${item.endDate}-${index}`}
                    className="flex gap-3 pb-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-xs">♪</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-xs mb-1 truncate">
                        {item.productName}
                      </h3>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span>{language === 'fr' ? 'Qté:' : 'Qty:'}</span>
                          <div className="flex items-center gap-1.5 border border-gray-300 rounded-md">
                            <button
                              onClick={() => decreaseQuantity(item.productId, item.startDate || undefined, item.endDate || undefined)}
                              className="px-2 py-0.5 hover:bg-gray-100 transition-colors text-gray-700 font-semibold"
                              aria-label={language === 'fr' ? 'Diminuer quantité' : 'Decrease quantity'}
                            >
                              −
                            </button>
                            <span className="px-2 py-0.5 min-w-[1.5rem] text-center font-semibold text-gray-900">
                              {quantity}
                            </span>
                            <button
                              onClick={async () => {
                                const result = await increaseQuantity(item.productId, item.startDate || undefined, item.endDate || undefined);
                                if (!result.success) {
                                  alert(result.error || (language === 'fr' 
                                    ? 'Stock insuffisant' 
                                    : 'Insufficient stock'));
                                }
                              }}
                              className="px-2 py-0.5 hover:bg-gray-100 transition-colors text-gray-700 font-semibold"
                              aria-label={language === 'fr' ? 'Augmenter quantité' : 'Increase quantity'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p>{rentalDays} {language === 'fr' ? 'jours' : 'days'}</p>
                        {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                          <p className="text-[#F2431E]">+{item.addons.length} {language === 'fr' ? 'option(s)' : 'option(s)'}</p>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-bold text-black text-xs">
                          {isNaN(itemTotal) ? '0.00' : itemTotal.toFixed(2)}€
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId, item.startDate || undefined, item.endDate || undefined)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          {currentTexts.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 text-sm">{currentTexts.subtotal}</span>
              <span className="text-lg font-bold text-black">
                {isNaN(cart.total) ? '0.00' : cart.total.toFixed(2)}€
              </span>
            </div>
            
            <div className="space-y-2">
              <Link
                href="/panier"
                onClick={onClose}
                className="block w-full bg-gray-100 text-gray-900 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center text-sm"
              >
                {currentTexts.viewCart}
              </Link>
              <Link
                href="/panier"
                onClick={onClose}
                className="block w-full bg-[#F2431E] text-white py-2.5 rounded-lg font-bold hover:bg-[#E63A1A] transition-colors text-center text-sm"
              >
                {currentTexts.checkout}
              </Link>
              <button
                onClick={() => {
                  if (confirm(language === 'fr' 
                    ? 'Êtes-vous sûr de vouloir vider votre panier ?' 
                    : 'Are you sure you want to clear your cart?')) {
                    clearCart();
                    onClose();
                  }
                }}
                className="w-full text-sm text-gray-600 hover:text-red-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                title={currentTexts.clear}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {currentTexts.clear}
              </button>
            </div>

            {/* Bonus: Contact CTA */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center mb-2">
                {currentTexts.needQuote}
              </p>
              <div className="flex gap-2">
                <a
                  href="https://wa.me/33651084994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span>💬</span>
                  {currentTexts.whatsapp}
                </a>
                <a
                  href="tel:+33651084994"
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-semibold text-xs hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span>📞</span>
                  {currentTexts.call}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

