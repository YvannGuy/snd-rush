
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import MiniCart from '@/components/cart/MiniCart';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import SignModal from '@/components/auth/SignModal';
import UserIconWithName from '@/components/UserIconWithName';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// Icônes lucide-react
import { User, ShoppingCart, Menu, X, Globe, ChevronDown } from 'lucide-react';


interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Ne pas afficher le bandeau noir sur les pages dashboard/admin et toutes les pages utilisateur (mes-*)
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/mes-');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { getCartItemCount, cart } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { user } = useUser();
  const { signOut } = useAuth();
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Synchroniser le compteur avec le panier en temps réel
  useEffect(() => {
    const count = getCartItemCount();
    setCartCount(count);
  }, [cart, getCartItemCount]);

  useEffect(() => {
    // Initialiser le compteur au montage
    setCartCount(getCartItemCount());
    
    const handleCartUpdate = (event?: CustomEvent) => {
      // Utiliser les données de l'événement si disponibles, sinon lire depuis le contexte
      if (event?.detail) {
        const cart = event.detail as { items: any[] };
        const count = cart.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        setCartCount(count);
      } else {
        setCartCount(getCartItemCount());
      }
    };
    
    const handleProductAdded = () => {
      // Mettre à jour le compteur immédiatement
      setCartCount(getCartItemCount());
      // Ne pas ouvrir le MiniCart si on est déjà sur la page panier
      if (pathname !== '/panier') {
        setIsMiniCartOpen(true);
      }
    };
    
    // Écouter l'événement avec le type correct
    const cartUpdateHandler = (event: Event) => handleCartUpdate(event as CustomEvent);
    window.addEventListener('cartUpdated', cartUpdateHandler);
    window.addEventListener('productAddedToCart', handleProductAdded);
    
    return () => {
      window.removeEventListener('cartUpdated', cartUpdateHandler);
      window.removeEventListener('productAddedToCart', handleProductAdded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, getCartItemCount]); // Inclure getCartItemCount pour la réactivité

  // Récupérer le prénom de l'utilisateur et vérifier le rôle admin
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id || !supabase) {
        setUserFirstName('');
        setIsAdmin(false);
        return;
      }

      // OPTIMISATION: Vérifier d'abord user_metadata et email avant de faire une requête DB
      // Cela évite les requêtes inutiles qui échouent (400)
      const metadataRole = user.user_metadata?.role?.toLowerCase();
      const isAdminFromMetadata = metadataRole === 'admin' || user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
      
      if (user.user_metadata?.first_name) {
        const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
        setUserFirstName(firstName);
        setIsAdmin(isAdminFromMetadata);
        return; // Ne pas faire de requête DB si on a déjà les données
      } else if (user.email) {
        const emailPart = user.email.split('@')[0];
        setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
        setIsAdmin(isAdminFromMetadata);
        return; // Ne pas faire de requête DB si on a déjà les données
      }

      // Seulement si pas de données dans metadata, essayer user_profiles (avec gestion d'erreur)
      // MAIS seulement si vraiment nécessaire (pas de first_name dans metadata ET pas d'email)
      // En pratique, on ne devrait jamais arriver ici car on a toujours un email
      if (!user.email) {
        // Pas d'email, on ne peut rien faire
        setIsAdmin(false);
        setUserFirstName('');
        return;
      }
      
      // Si on arrive ici, on a un email mais pas de first_name dans metadata
      // On peut essayer user_profiles, mais avec une gestion d'erreur robuste
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('first_name, role')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 400

        // Ignorer les erreurs 400 (PGRST116 = no rows returned, c'est normal)
        if (error) {
          // Ne logger que les vraies erreurs (pas PGRST116)
          if (error.code !== 'PGRST116' && error.code !== '42P01') { // 42P01 = table doesn't exist
            console.warn('⚠️ Header - Erreur récupération user_profiles (ignorée):', error.code, error.message);
          }
          // En cas d'erreur, utiliser les métadonnées
          setIsAdmin(isAdminFromMetadata);
          return;
        }

        if (profile) {
          const isAdminRole = profile.role?.toLowerCase() === 'admin' || user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
          setIsAdmin(isAdminRole);

          if (profile.first_name) {
            const firstName = profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1).toLowerCase();
            setUserFirstName(firstName);
          }
        } else {
          setIsAdmin(isAdminFromMetadata);
        }
      } catch (error: any) {
        // En cas d'erreur, utiliser les métadonnées (ne pas logger pour éviter le spam)
        setIsAdmin(isAdminFromMetadata);
        // Le prénom est déjà défini depuis l'email plus haut
      }
    };

    if (user) {
      fetchUserData();
    } else {
      setUserFirstName('');
      setIsAdmin(false);
    }
  }, [user]);



  const getUserInitials = (user: any) => {
    const email = user?.email || '';
    return email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Attendre un peu pour que l'état d'authentification soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Vider également le localStorage du panier et autres données utilisateur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sndrush_cart');
        // Dispatcher un événement pour vider le panier dans le contexte
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
      }
      
      // Forcer un rechargement complet de la page pour s'assurer que l'utilisateur est déconnecté
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, vider quand même le localStorage et rediriger
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sndrush_cart');
        // Vider les clés Supabase
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        window.location.href = '/';
      }
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    onLanguageChange(newLanguage);
  };

  const texts = {
    fr: {
      solutions: 'Solutions',
      conference: 'Conférence',
      soiree: 'Soirée',
      mariage: 'Mariage',
      urgence: 'Urgence',
      commentCaMarche: 'Comment ça marche',
      cataloguePro: 'Catalogue pro',
      catalogue: 'Catalogue',
      packs: 'Packs',
      faq: 'FAQ',
      callNow: 'Appelez',
      banner: '1er spécialiste de l\'urgence sonore • Paris et Île-de-France • 24h/24 7j/7 • Intervention rapide • Devis gratuit',
      account: 'Mon compte',
      reservations: 'Mes réservations',
      contracts: 'Mes contrats',
      invoices: 'Mes factures',
      signOut: 'Déconnexion',
      adminPanel: 'Panneau admin',
      adminReservations: 'Réservations',
      adminPlanning: 'Planning',
      adminClients: 'Clients',
      adminEtatsDesLieux: 'États des lieux',
      adminCatalog: 'Catalogue',
      adminInvoices: 'Factures',
    },
    en: {
      solutions: 'Solutions',
      conference: 'Conference',
      soiree: 'Party',
      mariage: 'Wedding',
      urgence: 'Emergency',
      commentCaMarche: 'How it works',
      cataloguePro: 'Pro catalog',
      catalogue: 'Catalogue',
      packs: 'Packs',
      faq: 'FAQ',
      callNow: 'Call',
      banner: '1st sound emergency specialist • Paris and Île-de-France • 24/7 • Fast intervention • Free quote',
      account: 'My account',
      reservations: 'My reservations',
      contracts: 'My contracts',
      invoices: 'My invoices',
      signOut: 'Sign out',
      adminPanel: 'Admin panel',
      adminReservations: 'Reservations',
      adminPlanning: 'Planning',
      adminClients: 'Clients',
      adminEtatsDesLieux: 'Condition reports',
      adminCatalog: 'Catalog',
      adminInvoices: 'Invoices',
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Header principal avec fond sombre */}
      <div className="bg-black relative" data-no-border style={{ border: 'none', boxShadow: 'none', margin: 0, outline: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo SoundRush */}
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold whitespace-nowrap">
                <span className="text-[#F2431E]">SoundRush</span>
                <span className="text-white"> Paris</span>
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-1">
                    {texts[language].solutions}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-black border border-gray-800">
                  <DropdownMenuItem asChild className="text-white hover:text-[#F2431E] hover:bg-gray-900 focus:bg-gray-900 focus:text-[#F2431E]">
                    <Link href="/conference" className="cursor-pointer">
                      {texts[language].conference}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:text-[#F2431E] hover:bg-gray-900 focus:bg-gray-900 focus:text-[#F2431E]">
                    <Link href="/soiree" className="cursor-pointer">
                      {texts[language].soiree}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:text-[#F2431E] hover:bg-gray-900 focus:bg-gray-900 focus:text-[#F2431E]">
                    <Link href="/mariage" className="cursor-pointer">
                      {texts[language].mariage}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link 
                href="/#urgence"
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {texts[language].urgence}
              </Link>
              <Link 
                href="/#how-it-works"
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {texts[language].commentCaMarche}
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-1 lg:gap-1">
              {/* CTA Principal - Appelez */}
              <Button
                asChild
                variant="default"
                size="default"
                className="hidden lg:flex bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                <a href="tel:+33651084994">
                  {texts[language].callNow}
                </a>
              </Button>

              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Login - Desktop only */}
              <div className="hidden lg:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                        aria-label={texts[language].account}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-semibold text-sm">{userFirstName || 'Login'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {texts[language].adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {texts[language].adminEtatsDesLieux}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/dashboard"
                              className="cursor-pointer"
                            >
                              {texts[language].account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {texts[language].contracts}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await handleSignOut();
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        {texts[language].signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignModalOpen(true)}
                    className="flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                    aria-label="Se connecter"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-semibold text-sm">Pro</span>
                  </Button>
                )}
              </div>
              
              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Panier - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMiniCartOpen(true)}
                className="hidden lg:flex relative text-white hover:text-[#F2431E] hover:bg-white/10"
                aria-label="Panier"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center p-0 animate-pulse"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </Badge>
                )}
              </Button>
              
              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />
              
              {/* Language switcher - Desktop only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="font-semibold text-sm uppercase">{language === 'fr' ? 'Fra' : 'Eng'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => {
                      if (language !== 'fr') toggleLanguage();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-semibold">Français</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (language !== 'en') toggleLanguage();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-semibold">English</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile buttons - Panier, Auth et Toggle regroupés */}
              <div className="lg:hidden flex items-center gap-0 flex-shrink-0">
                {/* Mobile menu button - Priorité pour être toujours visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-lg relative z-50 flex-shrink-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Panier Mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMiniCartOpen(true)}
                  className="relative text-white flex-shrink-0"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center p-0"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </Badge>
                  )}
                </Button>
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Auth Icon - Mobile - Version compacte */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                        aria-label={texts[language].account}
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {texts[language].adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {texts[language].adminEtatsDesLieux}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/dashboard"
                              className="cursor-pointer"
                            >
                              {texts[language].account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {texts[language].contracts}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await handleSignOut();
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        {texts[language].signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSignModalOpen(true)}
                    className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                    aria-label="Se connecter"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                )}
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Language switcher Mobile - Version compacte */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-[#F2431E] hover:bg-transparent flex-shrink-0"
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== 'fr') toggleLanguage();
                      }}
                      className="cursor-pointer"
                    >
                      <span className="font-semibold">Français</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== 'en') toggleLanguage();
                      }}
                      className="cursor-pointer"
                    >
                      <span className="font-semibold">English</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden fixed top-16 left-0 right-0 border-t border-white/20 z-40 overflow-hidden bg-black"
            >
              <div className="pt-3 pb-4 space-y-2 px-4 sm:px-6 lg:px-8">
            {/* CTA Appelez - Mobile */}
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="tel:+33651084994">
                {texts[language].callNow}
              </a>
            </Button>

            {/* Navigation Links - Mobile */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="text-white font-medium text-base py-2">
                {texts[language].solutions}
              </div>
              <div className="flex flex-col gap-1 pl-4">
                <Link 
                  href="/conference"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-[#F2431E] transition-colors text-sm py-1"
                >
                  {texts[language].conference}
                </Link>
                <Link 
                  href="/soiree"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-[#F2431E] transition-colors text-sm py-1"
                >
                  {texts[language].soiree}
                </Link>
                <Link 
                  href="/mariage"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-[#F2431E] transition-colors text-sm py-1"
                >
                  {texts[language].mariage}
                </Link>
              </div>
              <Link 
                href="/#urgence"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {texts[language].urgence}
              </Link>
              <Link 
                href="/#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {texts[language].commentCaMarche}
              </Link>
            </div>

            {/* Language switcher for mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 w-full justify-start text-white hover:text-[#F2431E] hover:bg-white/10"
                >
                  <Globe className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase">{language === 'fr' ? 'Fra' : 'Eng'}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={() => {
                    if (language !== 'fr') toggleLanguage();
                  }}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">Français</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (language !== 'en') toggleLanguage();
                  }}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Mini Cart */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        language={language}
      />

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => {
          // Le panier sera attaché automatiquement via CartContext
          setIsSignModalOpen(false);
          // Rediriger vers le dashboard après connexion
          router.push('/dashboard');
        }}
        onOpenAdminModal={() => {
          setIsSignModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Admin Sign Modal */}
      <SignModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        language={language}
        isAdmin={true}
        onSuccess={() => {
          setIsAdminModalOpen(false);
          router.push('/admin');
        }}
        onOpenUserModal={() => {
          setIsAdminModalOpen(false);
          setIsSignModalOpen(true);
        }}
      />

    </header>
  );
}
