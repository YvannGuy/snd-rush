'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { CartItem, Cart } from '@/types/db';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';

interface CartContextType {
  cart: Cart;
  addToCart: (item: CartItem) => Promise<{ success: boolean; error?: string; availableQuantity?: number }>;
  removeFromCart: (productId: string, startDate?: string, endDate?: string) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  increaseQuantity: (productId: string, startDate?: string, endDate?: string) => Promise<{ success: boolean; error?: string; availableQuantity?: number }>;
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
  const cartClearedRef = useRef<boolean>(false); // Flag pour empêcher le rechargement après clearCart

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    // Ne pas charger si le panier vient d'être vidé (sessionStorage persiste pendant la session)
    const cartClearedInSession = sessionStorage.getItem('cart_cleared');
    if (cartClearedInSession === 'true') {
      // Vider le localStorage aussi pour être sûr
      localStorage.removeItem('sndrush_cart');
      setCart({ items: [], total: 0, depositTotal: 0 });
      // Dispatcher l'événement pour mettre à jour le badge
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
      }
      return;
    }

    const savedCart = localStorage.getItem('sndrush_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Ne charger que si le panier n'est pas vide
        if (parsedCart.items && parsedCart.items.length > 0) {
          // Vérifier si on est sur la page de succès - si oui, ne pas charger
          if (typeof window !== 'undefined' && window.location.pathname.includes('/panier/success')) {
            // Vider le panier si on est sur la page de succès
            localStorage.removeItem('sndrush_cart');
            sessionStorage.setItem('cart_cleared', 'true');
            setCart({ items: [], total: 0, depositTotal: 0 });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
            }
            return;
          }
          setCart(parsedCart);
        } else {
          // Si le panier est vide, s'assurer qu'il est bien vide
          setCart({ items: [], total: 0, depositTotal: 0 });
        }
      } catch (e) {
        console.error('Erreur chargement panier:', e);
        // En cas d'erreur, vider le localStorage
        localStorage.removeItem('sndrush_cart');
        setCart({ items: [], total: 0, depositTotal: 0 });
      }
    } else {
      // Pas de panier dans localStorage, s'assurer qu'il est vide
      setCart({ items: [], total: 0, depositTotal: 0 });
    }
  }, []);

  // Charger le panier depuis Supabase si l'utilisateur est connecté
  useEffect(() => {
    // Ne pas charger si le panier vient d'être vidé (sessionStorage persiste pendant la session)
    const cartClearedInSession = sessionStorage.getItem('cart_cleared');
    if (cartClearedInSession === 'true') {
      return;
    }

    if (!user || !supabase || cartClearedRef.current) return;

    const loadCartFromSupabase = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      
      try {
        // Ne pas charger si on est sur la page de succès
        if (typeof window !== 'undefined' && window.location.pathname.includes('/panier/success')) {
          return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/user/cart', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        // Ne pas afficher d'erreur si Supabase n'est pas configuré (500) ou si non authentifié (401)
        if (response.status === 500 || response.status === 401) {
          console.warn('Panier non disponible, utilisation du panier local uniquement');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const serverCart = data.cart;
          
          // Récupérer le panier localStorage pour le fusionner
          const localCartStr = localStorage.getItem('sndrush_cart');
          const localCart = localCartStr ? JSON.parse(localCartStr) : null;
          
          // Vérifier si le panier correspond à une commande déjà payée
          // Si l'utilisateur a des réservations CONFIRMED récentes, vider le panier
          if (serverCart && serverCart.items && serverCart.items.length > 0) {
            try {
              // Vérifier s'il y a des réservations CONFIRMED récentes (dernières 5 minutes)
              const { data: recentReservations } = await supabaseClient
                .from('reservations')
                .select('id, created_at')
                .eq('user_id', user.id)
                .eq('status', 'CONFIRMED')
                .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

              // Si une réservation récente existe, vider le panier (probablement déjà payé)
              if (recentReservations && recentReservations.length > 0) {
                console.log('✅ Réservation récente détectée, vidage du panier');
                // Vider le panier serveur
                await fetch('/api/user/cart', {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                });
                // Vider le localStorage
                localStorage.removeItem('sndrush_cart');
                // Marquer comme vidé dans sessionStorage
                sessionStorage.setItem('cart_cleared', 'true');
                setCart({ items: [], total: 0, depositTotal: 0 });
                return;
              }
            } catch (checkError) {
              console.error('Erreur vérification réservations:', checkError);
            }

            // Ne charger que si le panier n'a pas été vidé récemment
            if (!cartClearedRef.current && cartClearedInSession !== 'true') {
              setCart({
                items: serverCart.items || [],
                total: serverCart.total_price || 0,
                depositTotal: serverCart.deposit_total || 0,
              });
            }
          } else {
            // Si le panier serveur est vide ou n'existe pas, vérifier le panier localStorage
            if (localCart && localCart.items && localCart.items.length > 0 && !cartClearedRef.current) {
              // Restaurer le panier localStorage et le sauvegarder dans Supabase
              console.log('📦 Restauration du panier depuis localStorage après connexion');
              setCart({
                items: localCart.items || [],
                total: localCart.total || 0,
                depositTotal: localCart.depositTotal || 0,
              });
              
              // Sauvegarder le panier localStorage dans Supabase
              setIsAttaching(true);
              try {
                await fetch('/api/cart/attach', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    items: localCart.items,
                    total: localCart.total || 0,
                    depositTotal: localCart.depositTotal || 0,
                  }),
                });
              } catch (error) {
                console.error('Erreur sauvegarde panier dans Supabase:', error);
              } finally {
                setIsAttaching(false);
              }
            } else if (!cartClearedRef.current) {
              // Si les deux sont vides, s'assurer que le panier est vide
              setCart({ items: [], total: 0, depositTotal: 0 });
            }
          }
        } else {
          // Si erreur API, utiliser le panier localStorage s'il existe
          const localCartStr = localStorage.getItem('sndrush_cart');
          const localCart = localCartStr ? JSON.parse(localCartStr) : null;
          
          if (localCart && localCart.items && localCart.items.length > 0 && !cartClearedRef.current) {
            console.log('📦 Utilisation du panier localStorage (erreur API)');
            setCart({
              items: localCart.items || [],
              total: localCart.total || 0,
              depositTotal: localCart.depositTotal || 0,
            });
          }
        }
      } catch (error) {
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
    // Ne pas sauvegarder si le panier vient d'être vidé
    if (cartClearedRef.current && cart.items.length === 0) {
      // Réinitialiser le flag après un court délai pour permettre les futures sauvegardes
      setTimeout(() => {
        cartClearedRef.current = false;
      }, 2000);
      return;
    }

    localStorage.setItem('sndrush_cart', JSON.stringify(cart));
    // Dispatcher un événement pour mettre à jour le badge du header
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));

    // Sauvegarder dans Supabase si l'utilisateur est connecté
    if (user && supabase && cart.items.length > 0 && !isAttaching && !cartClearedRef.current) {
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
      const dailyPrice = typeof item.dailyPrice === 'number' ? item.dailyPrice : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      const rentalDays = typeof item.rentalDays === 'number' ? item.rentalDays : 1;
      const itemTotal = dailyPrice * quantity * rentalDays;
      
      const addonsTotal = (item.addons && Array.isArray(item.addons))
        ? item.addons.reduce((addonSum, addon) => {
            const addonPrice = typeof addon.price === 'number' ? addon.price : 0;
            return addonSum + addonPrice;
          }, 0)
        : 0;
      
      // Ajouter la majoration d'urgence si présente (pour compatibilité avec anciens items)
      // Note: La majoration devrait maintenant être incluse dans dailyPrice, mais on garde cette logique pour les anciens items
      const urgencySurcharge = typeof item.metadata?.urgencySurcharge === 'number' 
        ? item.metadata.urgencySurcharge 
        : 0;
      
      return sum + itemTotal + addonsTotal + urgencySurcharge;
    }, 0);

    const depositTotal = items.reduce((sum, item) => {
      const deposit = typeof item.deposit === 'number' ? item.deposit : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return sum + deposit * quantity;
    }, 0);

    return { total, depositTotal };
  };

  /**
   * Vérifie le stock disponible pour un produit en tenant compte :
   * - Du stock total du produit
   * - Des réservations existantes pour la période
   * - De la quantité déjà dans le panier pour cette période
   */
  const checkStockAvailability = async (
    productId: string,
    requestedQuantity: number,
    startDate: string,
    endDate: string,
    startTime?: string,
    endTime?: string,
    currentCartQuantity: number = 0
  ): Promise<{ available: boolean; availableQuantity: number; error?: string }> => {
    // Si c'est un pack (commence par "pack-"), on considère qu'il y a toujours au moins 1 disponible
    // Les packs sont gérés différemment car ils ne sont pas dans la table products
    if (productId.startsWith('pack-') || productId.startsWith('pack_')) {
      // Pour les packs, on vérifie juste qu'on ne dépasse pas une limite raisonnable (ex: 10)
      const maxPackQuantity = 10;
      const totalRequested = currentCartQuantity + requestedQuantity;
      if (totalRequested > maxPackQuantity) {
        return {
          available: false,
          availableQuantity: Math.max(0, maxPackQuantity - currentCartQuantity),
          error: `Quantité maximale de ${maxPackQuantity} packs autorisée`,
        };
      }
      return { available: true, availableQuantity: maxPackQuantity - currentCartQuantity };
    }

    // Pour les produits individuels, vérifier via l'API availability
    try {
      const params = new URLSearchParams({
        productId,
        startDate,
        endDate,
      });
      
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);

      const response = await fetch(`/api/availability?${params.toString()}`);
      
      if (!response.ok) {
        console.error('Erreur vérification disponibilité:', response.status);
        // En cas d'erreur, autoriser l'ajout mais loguer l'erreur
        return { available: true, availableQuantity: 999 };
      }

      const data = await response.json();
      const { available, remaining, totalQuantity } = data;

      // Calculer la quantité disponible en tenant compte de ce qui est déjà dans le panier
      // Si le produit est déjà dans le panier pour cette période, on doit soustraire cette quantité
      const availableAfterCart = remaining - currentCartQuantity;

      if (availableAfterCart < requestedQuantity) {
        return {
          available: false,
          availableQuantity: Math.max(0, availableAfterCart),
          error: `Stock insuffisant. Quantité disponible : ${Math.max(0, availableAfterCart)} unité(s)`,
        };
      }

      return {
        available: true,
        availableQuantity: availableAfterCart,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du stock:', error);
      // En cas d'erreur réseau, autoriser l'ajout mais loguer l'erreur
      return { available: true, availableQuantity: 999 };
    }
  };

  const addToCart = async (item: CartItem): Promise<{ success: boolean; error?: string; availableQuantity?: number }> => {
    // Réinitialiser le flag de panier vidé si on ajoute un produit
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cart_cleared');
      cartClearedRef.current = false;
    }

    // Normaliser les valeurs pour éviter NaN
    const normalizedItem: CartItem = {
      ...item,
      dailyPrice: typeof item.dailyPrice === 'number' && !isNaN(item.dailyPrice) ? item.dailyPrice : 0,
      quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      rentalDays: typeof item.rentalDays === 'number' && !isNaN(item.rentalDays) && item.rentalDays > 0 ? item.rentalDays : 1,
      deposit: typeof item.deposit === 'number' && !isNaN(item.deposit) ? item.deposit : 0,
      addons: Array.isArray(item.addons) ? item.addons.map(addon => ({
        ...addon,
        price: typeof addon.price === 'number' && !isNaN(addon.price) ? addon.price : 0,
      })) : [],
    };

    // Vérifier le stock disponible avant d'ajouter
    const currentCart = cart;
    const existingIndex = currentCart.items.findIndex(
      (i) => i.productId === normalizedItem.productId && 
             i.startDate === normalizedItem.startDate && 
             i.endDate === normalizedItem.endDate &&
             i.startTime === normalizedItem.startTime &&
             i.endTime === normalizedItem.endTime
    );

    const currentCartQuantity = existingIndex >= 0 
      ? (currentCart.items[existingIndex].quantity || 0)
      : 0;

    // Vérifier que les dates sont présentes avant de vérifier le stock
    if (!normalizedItem.startDate || !normalizedItem.endDate) {
      return {
        success: false,
        error: 'Les dates de début et de fin sont requises',
        availableQuantity: 0,
      };
    }

    const stockCheck = await checkStockAvailability(
      normalizedItem.productId,
      normalizedItem.quantity,
      normalizedItem.startDate,
      normalizedItem.endDate,
      normalizedItem.startTime,
      normalizedItem.endTime,
      currentCartQuantity
    );

    if (!stockCheck.available) {
      return {
        success: false,
        error: stockCheck.error || 'Stock insuffisant',
        availableQuantity: stockCheck.availableQuantity,
      };
    }

    // Si le stock est disponible, ajouter au panier
    setCart((prevCart) => {
      // Vérifier si le produit existe déjà dans le panier (même période et heures)
      const existingIndex = prevCart.items.findIndex(
        (i) => i.productId === normalizedItem.productId && 
               i.startDate === normalizedItem.startDate && 
               i.endDate === normalizedItem.endDate &&
               i.startTime === normalizedItem.startTime &&
               i.endTime === normalizedItem.endTime
      );

      let newItems: CartItem[];
      
      if (existingIndex >= 0) {
        // Mettre à jour la quantité si le produit existe déjà
        newItems = [...prevCart.items];
        const existingQuantity = typeof newItems[existingIndex].quantity === 'number' && !isNaN(newItems[existingIndex].quantity) 
          ? newItems[existingIndex].quantity 
          : 1;
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: existingQuantity + normalizedItem.quantity,
        };
      } else {
        // Ajouter un nouvel item
        newItems = [...prevCart.items, normalizedItem];
      }

      const { total, depositTotal } = calculateTotals(newItems);
      const newCart = { items: newItems, total, depositTotal };
      
      // Marquer qu'un produit vient d'être ajouté (nouveau ou quantité augmentée)
      // Cela déclenchera la mise à jour du compteur
      productAddedRef.current = true;
      
      return newCart;
    });

    return { success: true, availableQuantity: stockCheck.availableQuantity };
  };

  // Dispatcher l'événement productAddedToCart après chaque changement du panier
  useEffect(() => {
    // Dispatcher immédiatement pour une mise à jour instantanée du compteur
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    
    if (productAddedRef.current) {
      productAddedRef.current = false;
      // Dispatcher aussi productAddedToCart pour ouvrir le mini cart
      window.dispatchEvent(new CustomEvent('productAddedToCart', { detail: cart }));
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

  const increaseQuantity = async (productId: string, startDate?: string, endDate?: string): Promise<{ success: boolean; error?: string; availableQuantity?: number }> => {
    const currentCart = cart;
    
    // Trouver l'item à augmenter
    const itemToIncrease = currentCart.items.find((item) => {
      if (startDate && endDate) {
        return item.productId === productId && item.startDate === startDate && item.endDate === endDate;
      } else {
        return item.productId === productId;
      }
    });

    if (!itemToIncrease) {
      return { success: false, error: 'Produit non trouvé dans le panier' };
    }

    // Vérifier que les dates sont présentes avant de vérifier le stock
    if (!itemToIncrease.startDate || !itemToIncrease.endDate) {
      return {
        success: false,
        error: 'Les dates de début et de fin sont requises',
        availableQuantity: 0,
      };
    }

    // Vérifier le stock disponible avant d'augmenter
    const stockCheck = await checkStockAvailability(
      itemToIncrease.productId,
      1, // On veut ajouter 1 unité
      itemToIncrease.startDate,
      itemToIncrease.endDate,
      itemToIncrease.startTime,
      itemToIncrease.endTime,
      itemToIncrease.quantity // Quantité actuelle dans le panier
    );

    if (!stockCheck.available) {
      return {
        success: false,
        error: stockCheck.error || 'Stock insuffisant',
        availableQuantity: stockCheck.availableQuantity,
      };
    }

    // Si le stock est disponible, augmenter la quantité
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

    return { success: true, availableQuantity: stockCheck.availableQuantity };
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
    // Marquer que le panier vient d'être vidé pour empêcher le rechargement
    cartClearedRef.current = true;
    
    // Utiliser sessionStorage pour persister pendant toute la session (même après rechargement)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cart_cleared', 'true');
    }
    
    // Vider le panier local
    setCart({ items: [], total: 0, depositTotal: 0 });
    
    // Vider le localStorage
    try {
      localStorage.removeItem('sndrush_cart');
    } catch (e) {
      console.error('Erreur suppression panier localStorage:', e);
    }
    
    // Dispatcher un événement pour mettre à jour le badge du header immédiatement
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
    }
    
    // Vider le panier Supabase si l'utilisateur est connecté
    if (user && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/user/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (response.ok) {
            console.log('✅ Panier Supabase vidé avec succès');
          } else {
            console.warn('⚠️ Erreur lors de la suppression du panier Supabase:', response.status);
          }
        }
      } catch (error) {
        console.error('Erreur suppression panier Supabase:', error);
      }
    }
    
    // Réinitialiser le flag après un délai pour permettre les futures opérations
    // Mais garder sessionStorage pour empêcher le rechargement
    setTimeout(() => {
      cartClearedRef.current = false;
    }, 5000); // 5 secondes devraient être suffisantes
  };

  const getCartItemCount = useCallback(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

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

