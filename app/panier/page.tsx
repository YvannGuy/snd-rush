'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/hooks/useUser';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';
import Image from 'next/image';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { CartItem, Product } from '@/types/db';
import { supabase } from '@/lib/supabase';
import { calculateInstallationPrice } from '@/lib/calculateInstallationPrice';

type DeliveryOption = 'paris' | 'petite_couronne' | 'grande_couronne' | 'retrait';

interface DeliveryOptionType {
  id: DeliveryOption;
  name: string;
  price: number;
}

export default function CartPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const depositInfoRef = useRef<HTMLDivElement>(null);
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, addToCart, clearCart } = useCart();
  const { user, loading: userLoading } = useUser();

  // Pré-remplir les champs avec les informations de l'utilisateur connecté
  useEffect(() => {
    if (!user || !supabase) return;

    const loadUserProfile = async () => {
      try {
        // Charger le profil utilisateur
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && profile) {
          // Pré-remplir l'email
          if (user.email && !customerEmail) {
            setCustomerEmail(user.email);
          }
          
          // Pré-remplir le nom depuis user_metadata ou profile
          if (!customerName) {
            const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || '';
            const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) {
              setCustomerName(fullName);
            } else if (user.email) {
              // Utiliser la partie avant @ de l'email comme nom par défaut
              setCustomerName(user.email.split('@')[0]);
            }
          }
          
          // Pré-remplir le téléphone depuis le profil
          if (profile.phone && !customerPhone) {
            setCustomerPhone(profile.phone);
          } else if (user.user_metadata?.phone && !customerPhone) {
            setCustomerPhone(user.user_metadata.phone);
          }
        } else {
          // Si pas de profil, utiliser au moins l'email
          if (user.email && !customerEmail) {
            setCustomerEmail(user.email);
          }
          // Essayer de récupérer le nom depuis user_metadata
          if (!customerName && user.user_metadata) {
            const firstName = user.user_metadata.first_name || user.user_metadata.firstName || '';
            const lastName = user.user_metadata.last_name || user.user_metadata.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) {
              setCustomerName(fullName);
            } else if (user.email) {
              setCustomerName(user.email.split('@')[0]);
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement profil utilisateur:', error);
        // Au minimum, pré-remplir l'email
        if (user.email && !customerEmail) {
          setCustomerEmail(user.email);
        }
      }
    };

    loadUserProfile();
  }, [user, customerEmail, customerName, customerPhone]);

  // Fermer le tooltip si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (depositInfoRef.current && !depositInfoRef.current.contains(event.target as Node)) {
        setShowDepositInfo(false);
      }
    };

    if (showDepositInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDepositInfo]);

  // Charger les produits recommandés depuis Supabase
  useEffect(() => {
    async function loadRecommendedProducts() {
      if (!supabase || cart.items.length === 0) {
        setRecommendedProducts([]);
        return;
      }

      try {
        // Analyser le contenu du panier pour déterminer les catégories recommandées
        const cartCategories = new Set<string>();
        const cartProductNames = cart.items.map(item => item.productName.toLowerCase());
        
        // Détecter les catégories dans le panier
        cartProductNames.forEach(name => {
          if (name.includes('pack') || name.includes('enceinte') || name.includes('caisson')) {
            cartCategories.add('sonorisation');
          }
          if (name.includes('micro')) {
            cartCategories.add('micros');
          }
          if (name.includes('led') || name.includes('lumière') || name.includes('lyre')) {
            cartCategories.add('lumieres');
          }
        });

        // Déterminer les catégories recommandées selon le contenu du panier
        let targetCategories: string[] = [];
        
        if (cartCategories.has('sonorisation')) {
          // Si le panier contient de la sono : recommander micros, câbles, accessoires
          targetCategories = ['micros', 'accessoires'];
        } else if (cartCategories.has('micros')) {
          // Si le panier contient des micros : recommander câbles, consoles, autres micros
          targetCategories = ['accessoires', 'sonorisation'];
        } else if (cartCategories.has('lumieres')) {
          // Si le panier contient des lumières : recommander autres lumières, câbles
          targetCategories = ['lumieres', 'accessoires'];
        } else {
          // Par défaut : recommander produits complémentaires
          targetCategories = ['micros', 'accessoires', 'lumieres'];
        }

        // Récupérer les IDs des produits déjà dans le panier (exclure les packs)
        const cartProductIds = cart.items
          .filter(item => !item.productId.startsWith('pack-'))
          .map(item => item.productId);

        // Charger les produits depuis Supabase
        const { data: allProducts, error } = await supabase
          .from('products')
          .select('*')
          .in('category', targetCategories)
          .limit(30); // Augmenter la limite pour avoir plus de choix, notamment pour les câbles

        // Exclure Pioneer XDJ et produits déjà dans le panier
        const filtered = allProducts?.filter(p => {
          const nameLower = p.name.toLowerCase();
          const isPioneer = nameLower.includes('pioneer') || nameLower.includes('xdj');
          const isInCart = cartProductIds.includes(p.id);
          return !isPioneer && !isInCart;
        }) || [];

        // S'assurer que les câbles XLR et RCA-XLR sont toujours inclus s'ils existent
        const cablesXlr = filtered.filter(p => {
          const nameLower = p.name.toLowerCase();
          return (nameLower.includes('xlr') || nameLower.includes('cable xlr') || nameLower.includes('câble xlr')) 
            && p.category === 'accessoires'
            && !nameLower.includes('rca');
        });
        
        const cablesRcaXlr = filtered.filter(p => {
          const nameLower = p.name.toLowerCase();
          return nameLower.includes('rca') && nameLower.includes('xlr') && p.category === 'accessoires';
        });

        // Si on n'a pas de câbles dans les résultats, essayer de les charger séparément
        let additionalCables: any[] = [];
        if (cablesXlr.length === 0 || cablesRcaXlr.length === 0) {
          const { data: cableProducts } = await supabase
            .from('products')
            .select('*')
            .eq('category', 'accessoires')
            .limit(20);
          
          if (cableProducts) {
            additionalCables = cableProducts.filter(p => {
              const nameLower = p.name.toLowerCase();
              const isPioneer = nameLower.includes('pioneer') || nameLower.includes('xdj');
              const isInCart = cartProductIds.includes(p.id);
              const isCableXlr = (nameLower.includes('xlr') || nameLower.includes('cable xlr') || nameLower.includes('câble xlr')) && !nameLower.includes('rca');
              const isCableRcaXlr = nameLower.includes('rca') && nameLower.includes('xlr');
              const isNotInFiltered = !filtered.find(fp => fp.id === p.id);
              return !isPioneer && !isInCart && (isCableXlr || isCableRcaXlr) && isNotInFiltered;
            });
          }
        }
        
        // Combiner filtered avec les câbles additionnels
        const allFiltered = [...filtered, ...additionalCables];

        if (error) {
          console.error('Erreur chargement produits recommandés:', error);
          return;
        }

        if (allFiltered.length > 0) {
          // Trier par pertinence selon le contenu du panier
          let sorted = allFiltered;
          
          if (cartCategories.has('sonorisation')) {
            // Prioriser micros, puis pieds d'enceinte, puis câbles XLR et RCA-XLR, puis autres accessoires
            sorted = filtered.sort((a, b) => {
              const aIsMicro = a.category === 'micros' ? 5 : 0;
              const bIsMicro = b.category === 'micros' ? 5 : 0;
              const aIsPied = (a.name.toLowerCase().includes('pied') || a.name.toLowerCase().includes('boomtone')) && a.category === 'accessoires' ? 4 : 0;
              const bIsPied = (b.name.toLowerCase().includes('pied') || b.name.toLowerCase().includes('boomtone')) && b.category === 'accessoires' ? 4 : 0;
              // Prioriser câbles XLR et RCA-XLR
              const aIsCableXlr = (a.name.toLowerCase().includes('xlr') || a.name.toLowerCase().includes('cable xlr') || a.name.toLowerCase().includes('câble xlr')) && a.category === 'accessoires' ? 3 : 0;
              const bIsCableXlr = (b.name.toLowerCase().includes('xlr') || b.name.toLowerCase().includes('cable xlr') || b.name.toLowerCase().includes('câble xlr')) && b.category === 'accessoires' ? 3 : 0;
              const aIsCableRcaXlr = (a.name.toLowerCase().includes('rca') && a.name.toLowerCase().includes('xlr')) && a.category === 'accessoires' ? 3 : 0;
              const bIsCableRcaXlr = (b.name.toLowerCase().includes('rca') && b.name.toLowerCase().includes('xlr')) && b.category === 'accessoires' ? 3 : 0;
              const aIsAccessoire = a.category === 'accessoires' ? 1 : 0;
              const bIsAccessoire = b.category === 'accessoires' ? 1 : 0;
              
              return (bIsMicro + bIsPied + bIsCableXlr + bIsCableRcaXlr + bIsAccessoire) - (aIsMicro + aIsPied + aIsCableXlr + aIsCableRcaXlr + aIsAccessoire);
            });
          } else if (cartCategories.has('micros')) {
            // Prioriser câbles XLR et RCA-XLR, adaptateurs, puis consoles
            sorted = filtered.sort((a, b) => {
              // Prioriser câbles XLR et RCA-XLR
              const aIsCableXlr = (a.name.toLowerCase().includes('xlr') || a.name.toLowerCase().includes('cable xlr') || a.name.toLowerCase().includes('câble xlr')) && a.category === 'accessoires' ? 4 : 0;
              const bIsCableXlr = (b.name.toLowerCase().includes('xlr') || b.name.toLowerCase().includes('cable xlr') || b.name.toLowerCase().includes('câble xlr')) && b.category === 'accessoires' ? 4 : 0;
              const aIsCableRcaXlr = (a.name.toLowerCase().includes('rca') && a.name.toLowerCase().includes('xlr')) && a.category === 'accessoires' ? 4 : 0;
              const bIsCableRcaXlr = (b.name.toLowerCase().includes('rca') && b.name.toLowerCase().includes('xlr')) && b.category === 'accessoires' ? 4 : 0;
              const aIsAdaptateur = a.name.toLowerCase().includes('adaptateur') ? 2 : 0;
              const bIsAdaptateur = b.name.toLowerCase().includes('adaptateur') ? 2 : 0;
              const aIsConsole = (a.name.toLowerCase().includes('promix') || a.name.toLowerCase().includes('console')) ? 1 : 0;
              const bIsConsole = (b.name.toLowerCase().includes('promix') || b.name.toLowerCase().includes('console')) ? 1 : 0;
              
              return (bIsCableXlr + bIsCableRcaXlr + bIsAdaptateur + bIsConsole) - (aIsCableXlr + aIsCableRcaXlr + aIsAdaptateur + aIsConsole);
            });
          } else {
            // Par défaut, prioriser aussi les câbles XLR et RCA-XLR
            sorted = filtered.sort((a, b) => {
              const aIsCableXlr = (a.name.toLowerCase().includes('xlr') || a.name.toLowerCase().includes('cable xlr') || a.name.toLowerCase().includes('câble xlr')) && a.category === 'accessoires' ? 3 : 0;
              const bIsCableXlr = (b.name.toLowerCase().includes('xlr') || b.name.toLowerCase().includes('cable xlr') || b.name.toLowerCase().includes('câble xlr')) && b.category === 'accessoires' ? 3 : 0;
              const aIsCableRcaXlr = (a.name.toLowerCase().includes('rca') && a.name.toLowerCase().includes('xlr')) && a.category === 'accessoires' ? 3 : 0;
              const bIsCableRcaXlr = (b.name.toLowerCase().includes('rca') && b.name.toLowerCase().includes('xlr')) && b.category === 'accessoires' ? 3 : 0;
              
              return (bIsCableXlr + bIsCableRcaXlr) - (aIsCableXlr + aIsCableRcaXlr);
            });
          }

          // S'assurer qu'on inclut au moins un câble XLR et un câble RCA-XLR s'ils existent
          const cablesXlrInSorted = sorted.filter(p => {
            const nameLower = p.name.toLowerCase();
            return (nameLower.includes('xlr') || nameLower.includes('cable xlr') || nameLower.includes('câble xlr')) 
              && p.category === 'accessoires'
              && !nameLower.includes('rca');
          });
          
          const cablesRcaXlrInSorted = sorted.filter(p => {
            const nameLower = p.name.toLowerCase();
            return nameLower.includes('rca') && nameLower.includes('xlr') && p.category === 'accessoires';
          });

          // Construire la liste finale en priorisant les câbles
          let finalProducts: any[] = [];
          
          // Ajouter d'abord un câble XLR s'il existe
          if (cablesXlrInSorted.length > 0 && !finalProducts.find(p => p.id === cablesXlrInSorted[0].id)) {
            finalProducts.push(cablesXlrInSorted[0]);
          }
          
          // Ajouter ensuite un câble RCA-XLR s'il existe
          if (cablesRcaXlrInSorted.length > 0 && !finalProducts.find(p => p.id === cablesRcaXlrInSorted[0].id)) {
            finalProducts.push(cablesRcaXlrInSorted[0]);
          }
          
          // Compléter avec les autres produits recommandés (jusqu'à 3 au total)
          const otherProducts = sorted.filter(p => 
            !finalProducts.find(fp => fp.id === p.id)
          );
          
          finalProducts = [...finalProducts, ...otherProducts].slice(0, 3);
          
          setRecommendedProducts(finalProducts);
        }
      } catch (err) {
        console.error('Erreur chargement produits recommandés:', err);
      }
    }

    loadRecommendedProducts();
  }, [cart.items]);

  const deliveryOptions: Record<DeliveryOption, DeliveryOptionType> = {
    paris: { id: 'paris', name: language === 'fr' ? 'Paris' : 'Paris', price: 80 },
    petite_couronne: { id: 'petite_couronne', name: language === 'fr' ? 'Petite Couronne' : 'Inner suburbs', price: 120 },
    grande_couronne: { id: 'grande_couronne', name: language === 'fr' ? 'Grande Couronne' : 'Outer suburbs', price: 160 },
    retrait: { id: 'retrait', name: language === 'fr' ? 'Retrait' : 'Pickup', price: 0 },
  };

  // Vérifier si la livraison est déjà dans le panier
  const deliveryItem = cart.items.find(item => item.productId.startsWith('delivery-'));
  const currentDeliveryOption = deliveryItem 
    ? (deliveryItem.productId.replace('delivery-', '') as DeliveryOption)
    : null;

  // L'installation et la livraison sont déjà dans cart.total car elles sont dans cart.items
  const totalWithDelivery = cart.total;

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
      deposit: 'Caution',
      depositInfo: 'Empreinte bancaire non débitée',
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
      customerPhone: 'Téléphone',
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
      deposit: 'Deposit',
      depositInfo: 'Bank authorization hold, not charged',
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
      customerPhone: 'Phone',
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

    // Attendre que le chargement de l'utilisateur soit terminé
    if (userLoading) {
      alert(language === 'fr' 
        ? 'Chargement en cours, veuillez patienter...' 
        : 'Loading, please wait...');
      return;
    }

    // Vérifier que les champs requis sont remplis
    if (!customerEmail || !customerName || !customerPhone) {
      alert(currentTexts.requiredFields);
      return;
    }

    // Si l'utilisateur n'est pas connecté ou n'a pas d'ID, ouvrir le modal de connexion
    if (!user || !user.id) {
      setPendingCheckout(true);
      setIsSignModalOpen(true);
      return;
    }

    // Récupérer l'option de livraison depuis le panier
    const deliveryItemInCart = cart.items.find(item => item.productId.startsWith('delivery-'));
    const finalDeliveryOption = deliveryItemInCart 
      ? (deliveryItemInCart.productId.replace('delivery-', '') as DeliveryOption)
      : 'retrait';

    if (!acceptTerms) {
      alert(language === 'fr' 
        ? 'Veuillez accepter les conditions de location.' 
        : 'Please accept the rental conditions.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Calculer les totaux (la livraison est déjà dans cart.total)
      const deliveryFee = deliveryItemInCart ? deliveryItemInCart.dailyPrice : 0;
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
            userId: user.id, // Envoyer l'ID de l'utilisateur connecté (garanti d'exister grâce à la vérification ci-dessus)
            cartItems: cart.items, // Utiliser cartItems pour le webhook
            items, // Format Stripe
            total,
            depositTotal,
            deliveryFee,
            deliveryOption: finalDeliveryOption,
            customerEmail,
            customerName,
            customerPhone,
            address: finalDeliveryOption !== 'retrait' ? customerAddress : '',
          }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Si la réponse n'est pas OK, afficher le message d'erreur de l'API
        const errorMessage = data.error || data.message || 'Erreur lors de la création de la session';
        console.error('❌ Erreur API checkout:', errorMessage, data);
        
        // Si c'est une erreur d'authentification, ouvrir le modal de connexion
        if (response.status === 401) {
          setPendingCheckout(true);
          setIsSignModalOpen(true);
          alert(language === 'fr' 
            ? 'Veuillez vous connecter pour continuer.' 
            : 'Please sign in to continue.');
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }
    } catch (error: any) {
      console.error('Erreur checkout:', error);
      const errorMessage = error.message || (language === 'fr' 
        ? 'Erreur lors du paiement. Veuillez réessayer.' 
        : 'Payment error. Please try again.');
      alert(errorMessage);
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

  // Calculer le prix d'installation recommandé
  const installationPrice = calculateInstallationPrice(cart.items);
  
  // Vérifier si l'installation est déjà dans le panier
  const installationItem = cart.items.find(item => item.productId === 'installation-service');
  const installationSelected = !!installationItem;

  // Handler pour ajouter/retirer l'installation
  const handleRequestInstallation = () => {
    if (installationPrice === null) {
      if (language === 'fr') {
        alert('Installation sur devis. Veuillez nous contacter.');
      } else {
        alert('Installation on quote. Please contact us.');
      }
      return;
    }

    if (installationSelected) {
      // Retirer l'installation du panier
      removeFromCart('installation-service', installationItem!.startDate, installationItem!.endDate);
    } else {
      // Ajouter l'installation au panier
      const firstItem = cart.items[0];
      const startDate = firstItem?.startDate || new Date().toISOString().split('T')[0];
      const endDate = firstItem?.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const installationCartItem: CartItem = {
        productId: 'installation-service',
        productName: language === 'fr' ? 'Installation par technicien' : 'Installation by technician',
        productSlug: 'installation',
        quantity: 1,
        rentalDays: 1, // Installation est un service unique, pas par jour
        startDate,
        endDate,
        dailyPrice: installationPrice,
        deposit: 0,
        addons: [],
        images: ['/installation.jpg'],
      };
      addToCart(installationCartItem);
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
      <main className="pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header épuré */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{currentTexts.title}</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {cart.items.length} {cart.items.length === 1 ? (language === 'fr' ? 'article' : 'item') : (language === 'fr' ? 'articles' : 'items')}
              </p>
            </div>
            {cart.items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(language === 'fr' 
                    ? 'Êtes-vous sûr de vouloir vider votre panier ?' 
                    : 'Are you sure you want to clear your cart?')) {
                    clearCart();
                  }
                }}
                className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-red-50 whitespace-nowrap"
                title={currentTexts.clear}
              >
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {currentTexts.clear}
              </button>
            )}
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
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{item.productName}</h3>
                            {/* Dates et heures - Affichage clair */}
                            <div className="space-y-1.5 mb-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">
                                  {new Date(item.startDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  {item.startTime && ` à ${item.startTime}`}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {new Date(item.endDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  {item.endTime && ` à ${item.endTime}`}
                                </span>
                              </div>
                              {/* Type d'événement et zone si disponibles */}
                              {(item.eventType || item.zone) && (
                                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                                  {item.eventType && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-gray-400">📅</span>
                                      <span className="capitalize">
                                        {item.eventType === 'mariage' ? (language === 'fr' ? 'Mariage' : 'Wedding') :
                                         item.eventType === 'anniversaire' ? (language === 'fr' ? 'Anniversaire' : 'Birthday') :
                                         item.eventType === 'corporate' ? (language === 'fr' ? 'Corporate' : 'Corporate') :
                                         item.eventType === 'soiree' ? (language === 'fr' ? 'Soirée' : 'Party') :
                                         item.eventType === 'eglise' ? (language === 'fr' ? 'Église' : 'Church') :
                                         item.eventType === 'association' ? (language === 'fr' ? 'Association' : 'Association') :
                                         item.eventType}
                                      </span>
                                    </span>
                                  )}
                                  {item.zone && item.zone !== 'retrait' && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-gray-400">📍</span>
                                      <span>
                                        {item.zone === 'paris' ? 'Paris' :
                                         item.zone === 'petite' ? (language === 'fr' ? 'Petite Couronne' : 'Inner suburbs') :
                                         item.zone === 'grande' ? (language === 'fr' ? 'Grande Couronne' : 'Outer suburbs') :
                                         item.zone}
                                      </span>
                                    </span>
                                  )}
                                  {item.metadata?.urgency && (
                                    <span className="flex items-center gap-1 text-orange-600 font-semibold">
                                      <span>⚡</span>
                                      <span>{language === 'fr' ? 'Urgence +20%' : 'Urgency +20%'}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl sm:text-2xl font-bold text-[#F2431E] mb-2">
                              {itemTotal.toFixed(2)}€
                            </div>
                            {/* Détail du calcul - Affichage clair */}
                            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-0.5">
                                {item.dailyPrice}€ × {item.quantity} × {item.rentalDays} {currentTexts.days}
                              </p>
                            </div>
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
                    {/* Carte Livraison - Compacte */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 w-[150px] flex-shrink-0 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 bg-[#F2431E]/10 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Livraison' : 'Delivery'}</h3>
                      </div>
                      <div className="space-y-1">
                        {Object.values(deliveryOptions).map((option) => {
                          const isSelected = currentDeliveryOption === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  // Retirer la livraison du panier
                                  if (deliveryItem) {
                                    removeFromCart(deliveryItem.productId, deliveryItem.startDate, deliveryItem.endDate);
                                  }
                                } else {
                                  // Ajouter la livraison au panier
                                  const firstItem = cart.items.find(item => !item.productId.startsWith('delivery-') && !item.productId.startsWith('installation-'));
                                  const startDate = firstItem?.startDate || new Date().toISOString().split('T')[0];
                                  const endDate = firstItem?.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
                                  
                                  // Retirer l'ancienne livraison si elle existe
                                  if (deliveryItem) {
                                    removeFromCart(deliveryItem.productId, deliveryItem.startDate, deliveryItem.endDate);
                                  }
                                  
                                  const deliveryCartItem: CartItem = {
                                    productId: `delivery-${option.id}`,
                                    productName: language === 'fr' 
                                      ? `Livraison - ${option.name}`
                                      : `Delivery - ${option.name}`,
                                    productSlug: 'delivery',
                                    quantity: 1,
                                    rentalDays: 1,
                                    startDate,
                                    endDate,
                                    dailyPrice: option.price,
                                    deposit: 0,
                                    addons: [],
                                    images: ['/livraison.jpg'],
                                  };
                                  addToCart(deliveryCartItem);
                                }
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded transition-all border ${
                                isSelected
                                  ? 'bg-[#F2431E]/10 border-[#F2431E]'
                                  : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-1.5">
                                <span className={`font-medium text-xs ${isSelected ? 'text-[#F2431E]' : 'text-gray-700'}`}>
                                  {option.name}
                                </span>
                                <span className={`font-bold flex-shrink-0 text-xs ${isSelected ? 'text-[#F2431E]' : option.id === 'retrait' ? 'text-green-600' : 'text-gray-700'}`}>
                                  {option.price > 0 ? `${option.price}€` : language === 'fr' ? 'Gratuit' : 'Free'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Carte Installation - Compacte */}
                    <div className={`bg-white rounded-lg p-4 shadow-sm border min-w-[200px] hover:shadow-md transition-shadow cursor-pointer ${
                      installationSelected ? 'border-[#F2431E] bg-[#F2431E]/5' : 'border-gray-100'
                    }`}>
                      <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100 mb-2">
                        <Image
                          src="/installation.jpg"
                          alt={language === 'fr' ? 'Installation' : 'Installation'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Installation' : 'Installation'}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {language === 'fr' 
                          ? 'Installation par technicien'
                          : 'Installation by technician'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${installationSelected ? 'text-[#F2431E]' : 'text-gray-900'}`}>
                          {installationPrice !== null 
                            ? `${installationPrice}€`
                            : (language === 'fr' ? 'Sur devis' : 'On quote')
                          }
                        </span>
                        <button 
                          onClick={handleRequestInstallation}
                          className={`px-3 py-1.5 rounded-md font-medium transition-colors text-xs ${
                            installationSelected
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                          }`}
                        >
                          {installationSelected 
                            ? (language === 'fr' ? 'Retirer' : 'Remove')
                            : (language === 'fr' ? 'Ajouter' : 'Add')
                          }
                        </button>
                      </div>
                    </div>

                    {/* Produits recommandés depuis Supabase */}
                    {recommendedProducts.map((product) => {
                      const productImage = product.images && product.images.length > 0 
                        ? (Array.isArray(product.images) ? product.images[0] : typeof product.images === 'string' ? product.images : '/placeholder-product.png')
                        : '/placeholder-product.png';
                      const productPrice = product.daily_price_ttc 
                        ? `${product.daily_price_ttc}€/j`
                        : language === 'fr' ? 'Sur devis' : 'On quote';

                      // Utiliser les dates du premier item du panier
                      const firstItem = cart.items[0];
                      const startDate = firstItem?.startDate || new Date().toISOString().split('T')[0];
                      const endDate = firstItem?.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      const rentalDays = firstItem?.rentalDays || 1;

                      const handleAddProduct = () => {
                        const cartItem: CartItem = {
                          productId: product.id,
                          productName: product.name,
                          productSlug: product.slug || product.id,
                          quantity: 1,
                          rentalDays,
                          startDate,
                          endDate,
                          dailyPrice: product.daily_price_ttc || 0,
                          deposit: product.deposit || 0,
                          addons: [],
                          images: Array.isArray(product.images) ? product.images : product.images ? [product.images] : [],
                        };
                        addToCart(cartItem);
                        
                        // Rafraîchir les produits recommandés pour exclure celui qui vient d'être ajouté
                        setRecommendedProducts(prev => prev.filter(p => p.id !== product.id));
                      };

                      return (
                        <Link
                          key={product.id}
                          href={`/catalogue/${product.slug || product.id}`}
                          className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[180px] hover:shadow-md transition-shadow cursor-pointer block"
                        >
                          <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100 mb-2">
                            <Image
                              src={productImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-[#F2431E]">{productPrice}</span>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddProduct();
                              }}
                              className="px-3 py-1 bg-[#F2431E] text-white rounded-md font-medium hover:bg-[#E63A1A] transition-colors text-xs"
                            >
                              {language === 'fr' ? 'Ajouter' : 'Add'}
                            </button>
                          </div>
                        </Link>
                      );
                    })}
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
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-2 relative" ref={depositInfoRef}>
                    <div className="flex items-center gap-1.5">
                      <span>{currentTexts.deposit}</span>
                      <button
                        type="button"
                        onClick={() => setShowDepositInfo(!showDepositInfo)}
                        className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] font-bold flex items-center justify-center hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:ring-offset-1"
                        aria-label={language === 'fr' ? 'Information sur la caution' : 'Deposit information'}
                      >
                        i
                      </button>
                      {showDepositInfo && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                          <p className="mb-1 font-semibold">{currentTexts.depositInfo}</p>
                          <p className="text-gray-300">
                            {language === 'fr' 
                              ? 'Cette somme sera bloquée sur votre carte bancaire mais ne sera pas débitée. Elle sera libérée après retour du matériel en bon état.'
                              : 'This amount will be held on your bank card but not charged. It will be released after the equipment is returned in good condition.'}
                          </p>
                          <div className="absolute bottom-0 left-4 transform translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
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
                    <div>
                      <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                        {currentTexts.customerPhone} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-[#F2431E] focus:ring-1 focus:ring-[#F2431E] focus:outline-none transition-colors"
                        placeholder={language === 'fr' ? '06 12 34 56 78' : '+33 6 12 34 56 78'}
                      />
                    </div>
                  {currentDeliveryOption && currentDeliveryOption !== 'retrait' && (
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
                  disabled={isProcessing || !customerEmail || !customerName || !customerPhone || (user ? !acceptTerms : false)}
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
