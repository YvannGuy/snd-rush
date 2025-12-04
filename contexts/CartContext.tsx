'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Cart } from '@/types/db';

interface CartContextType {
  cart: Cart;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, depositTotal: 0 });

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem('sndrush_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Erreur chargement panier:', e);
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('sndrush_cart', JSON.stringify(cart));
    // Dispatcher un événement pour mettre à jour le badge du header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  }, [cart]);

  const calculateTotals = (items: CartItem[]): { total: number; depositTotal: number } => {
    const total = items.reduce((sum, item) => {
      const itemTotal = item.dailyPrice * item.quantity * item.rentalDays;
      const addonsTotal = item.addons.reduce((addonSum, addon) => addonSum + addon.price, 0);
      return sum + itemTotal + addonsTotal;
    }, 0);

    const depositTotal = items.reduce((sum, item) => {
      return sum + item.deposit * item.quantity;
    }, 0);

    return { total, depositTotal };
  };

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      // Vérifier si le produit existe déjà dans le panier
      const existingIndex = prevCart.items.findIndex(
        (i) => i.productId === item.productId && i.startDate === item.startDate && i.endDate === item.endDate
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        // Mettre à jour la quantité si le produit existe déjà
        newItems = [...prevCart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
        };
      } else {
        // Ajouter un nouvel item
        newItems = [...prevCart.items, item];
      }

      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.productId !== productId);
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const increaseQuantity = (productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0);
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const updateCartItem = (productId: string, updates: Partial<CartItem>) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.productId === productId ? { ...item, ...updates } : item
      );
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, depositTotal: 0 });
  };

  const getCartItemCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

