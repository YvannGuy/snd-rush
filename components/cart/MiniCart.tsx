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
  const { cart, removeFromCart, updateCartItem } = useCart();
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
      if (cartRef.current && !cartRef.current.contains(event.target as Node) && !isMobile) {
        onClose();
      }
    };
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile, onClose]);

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
        onClick={isMobile ? onClose : undefined}
      />

      {/* Cart Drawer/Dropdown */}
      <div
        ref={cartRef}
        className={`fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isMobile
            ? `top-0 right-0 h-full w-full sm:w-96 flex flex-col ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
              }`
            : `top-16 right-4 w-96 rounded-2xl border border-gray-200 ${
                isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
              }`
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">{currentTexts.title}</h2>
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
        <div className="flex-1 overflow-y-auto p-6">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-semibold text-gray-900 mb-2">{currentTexts.empty}</p>
              <p className="text-sm text-gray-600 mb-6">{currentTexts.emptyDescription}</p>
              <div className="space-y-3">
                <Link
                  href="/packs"
                  onClick={onClose}
                  className="block w-full bg-[#F2431E] text-white py-3 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                >
                  {currentTexts.explorePacks}
                </Link>
                <Link
                  href="/catalogue"
                  onClick={onClose}
                  className="block w-full border-2 border-[#F2431E] text-[#F2431E] py-3 rounded-lg font-semibold hover:bg-[#F2431E]/10 transition-colors"
                >
                  {currentTexts.exploreProducts}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, index) => {
                const itemTotal = item.dailyPrice * item.quantity * item.rentalDays + 
                  item.addons.reduce((sum, addon) => sum + addon.price, 0);
                
                return (
                  <div
                    key={`${item.productId}-${item.startDate}-${item.endDate}-${index}`}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    {item.images && item.images.length > 0 && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.images[0]}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {item.productName}
                      </h3>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>Qty: {item.quantity}</p>
                        <p>{item.rentalDays} {language === 'fr' ? 'jours' : 'days'}</p>
                        {item.addons.length > 0 && (
                          <p className="text-[#F2431E]">+{item.addons.length} {language === 'fr' ? 'option(s)' : 'option(s)'}</p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-black text-sm">
                          {itemTotal.toFixed(2)}€
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
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
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{currentTexts.subtotal}</span>
              <span className="text-xl font-bold text-black">{cart.total.toFixed(2)}€</span>
            </div>
            
            <div className="space-y-2">
              <Link
                href="/panier"
                onClick={onClose}
                className="block w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
              >
                {currentTexts.viewCart}
              </Link>
              <Link
                href="/panier"
                onClick={onClose}
                className="block w-full bg-[#F2431E] text-white py-3 rounded-lg font-bold hover:bg-[#E63A1A] transition-colors text-center"
              >
                {currentTexts.checkout}
              </Link>
            </div>

            {/* Bonus: Contact CTA */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center mb-3">
                {currentTexts.needQuote}
              </p>
              <div className="flex gap-2">
                <a
                  href="https://wa.me/33651084994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span>💬</span>
                  {currentTexts.whatsapp}
                </a>
                <a
                  href="tel:+33651084994"
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-1"
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

