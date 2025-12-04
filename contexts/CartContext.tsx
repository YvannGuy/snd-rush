'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CartItem, Cart } from '@/types/db';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';

interface CartContextType {
  cart: Cart;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, startDate?: string, endDate?: string) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  increaseQuantity: (productId: string, startDate?: string, endDate?: string) => void;
  decreaseQuantity: (productId: string, startDate?: string, endDate?: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, depositTotal: 0 });
  const { user } = useUser();
  const [isAttaching, setIsAttaching] = useState(false);
  const productAddedRef = useRef<boolean>(false);

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

  // Charger le panier depuis Supabase si l'utilisateur est connecté
  useEffect(() => {
    if (!user || !supabase) return;

    const loadCartFromSupabase = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/user/cart', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        // Ne pas afficher d'erreur si Supabase n'est pas configuré (500) ou si non authentifié (401)
        if (response.status === 500 || response.status === 401) {
          // Sur la page de succès, c'est normal que le panier soit vide après paiement
          if (window.location.pathname.includes('/success')) {
            return;
          }
          console.warn('Panier non disponible, utilisation du panier local uniquement');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const serverCart = data.cart;
          if (serverCart && serverCart.items && serverCart.items.length > 0) {
            // Fusionner avec le panier local si nécessaire
            setCart({
              items: serverCart.items || [],
              total: serverCart.total_price || 0,
              depositTotal: serverCart.deposit_total || 0,
            });
          } else if (serverCart && (!serverCart.items || serverCart.items.length === 0)) {
            // Si le panier serveur est vide, vider aussi le panier local
            setCart({ items: [], total: 0, depositTotal: 0 });
          }
        }
      } catch (error) {
        // Ne pas afficher d'erreur si c'est juste une configuration manquante ou sur la page de succès
        if (window.location.pathname.includes('/success')) {
          return;
        }
        if (error instanceof Error && !error.message.includes('Configuration Supabase manquante')) {
          console.error('Erreur chargement panier Supabase:', error);
        }
      }
    };

    loadCartFromSupabase();
  }, [user]);

  // Attacher le panier local à l'utilisateur après connexion
  useEffect(() => {
    if (!user || !supabase || isAttaching || cart.items.length === 0) return;

    const attachCartToUser = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      setIsAttaching(true);
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
          setIsAttaching(false);
          return;
        }

        const response = await fetch('/api/cart/attach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            items: cart.items,
            total: cart.total,
            depositTotal: cart.depositTotal,
          }),
        });

        if (response.ok) {
          console.log('Panier attaché à l\'utilisateur avec succès');
        }
      } catch (error) {
        console.error('Erreur attachement panier:', error);
      } finally {
        setIsAttaching(false);
      }
    };

    attachCartToUser();
  }, [user?.id]); // Se déclenche uniquement quand l'utilisateur se connecte

  // Sauvegarder le panier dans localStorage et Supabase à chaque changement
  useEffect(() => {
    localStorage.setItem('sndrush_cart', JSON.stringify(cart));
    // Dispatcher un événement pour mettre à jour le badge du header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));

    // Sauvegarder dans Supabase si l'utilisateur est connecté
    if (user && supabase && cart.items.length > 0 && !isAttaching) {
      const saveCartToSupabase = async () => {
        const supabaseClient = supabase;
        if (!supabaseClient) return;
        
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (!session) return;

          await fetch('/api/cart/attach', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              items: cart.items,
              total: cart.total,
              depositTotal: cart.depositTotal,
            }),
          });
        } catch (error) {
          console.error('Erreur sauvegarde panier Supabase:', error);
        }
      };

      // Debounce pour éviter trop de requêtes
      const timeoutId = setTimeout(saveCartToSupabase, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user, isAttaching]);

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
      const isNewItem = existingIndex < 0;
      
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
      const newCart = { items: newItems, total, depositTotal };
      
      // Marquer qu'un produit vient d'être ajouté (pour dispatcher l'événement après le rendu)
      if (isNewItem) {
        productAddedRef.current = true;
      }
      
      return newCart;
    });
  };

  // Dispatcher l'événement productAddedToCart après le rendu
  useEffect(() => {
    if (productAddedRef.current) {
      productAddedRef.current = false;
      // Utiliser setTimeout pour différer après le rendu
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('productAddedToCart', { detail: cart }));
      }, 0);
    }
  }, [cart]);

  const removeFromCart = (productId: string, startDate?: string, endDate?: string) => {
    setCart((prevCart) => {
      // Si startDate et endDate sont fournis, retirer uniquement l'item avec ces dates spécifiques
      // Sinon, retirer tous les items avec ce productId (comportement de fallback)
      const newItems = prevCart.items.filter((item) => {
        if (startDate && endDate) {
          // Retirer uniquement l'item avec ces dates spécifiques
          return !(item.productId === productId && item.startDate === startDate && item.endDate === endDate);
        } else {
          // Fallback : retirer tous les items avec ce productId
          return item.productId !== productId;
        }
      });
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const increaseQuantity = (productId: string, startDate?: string, endDate?: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => {
        // Si startDate et endDate sont fournis, mettre à jour uniquement l'item avec ces dates spécifiques
        if (startDate && endDate) {
          if (item.productId === productId && item.startDate === startDate && item.endDate === endDate) {
            return { ...item, quantity: item.quantity + 1 };
          }
        } else {
          // Sinon, mettre à jour tous les items avec ce productId
          if (item.productId === productId) {
            return { ...item, quantity: item.quantity + 1 };
          }
        }
        return item;
      });
      const { total, depositTotal } = calculateTotals(newItems);
      return { items: newItems, total, depositTotal };
    });
  };

  const decreaseQuantity = (productId: string, startDate?: string, endDate?: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items
        .map((item) => {
          // Si startDate et endDate sont fournis, mettre à jour uniquement l'item avec ces dates spécifiques
          if (startDate && endDate) {
            if (item.productId === productId && item.startDate === startDate && item.endDate === endDate) {
              return { ...item, quantity: Math.max(1, item.quantity - 1) };
            }
          } else {
            // Sinon, mettre à jour tous les items avec ce productId
            if (item.productId === productId) {
              return { ...item, quantity: Math.max(1, item.quantity - 1) };
            }
          }
          return item;
        })
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

  const clearCart = async () => {
    // Vider le panier local
    setCart({ items: [], total: 0, depositTotal: 0 });
    
    // Vider le localStorage
    try {
      localStorage.removeItem('sndrush_cart');
    } catch (e) {
      console.error('Erreur suppression panier localStorage:', e);
    }
    
    // Vider le panier Supabase si l'utilisateur est connecté
    if (user && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/user/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
        }
      } catch (error) {
        console.error('Erreur suppression panier Supabase:', error);
      }
    }
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

