
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import MiniCart from '@/components/cart/MiniCart';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { usePro } from '@/hooks/usePro';
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
import { User, ShoppingCart, Menu, X, Globe, ChevronDown, Phone } from 'lucide-react';


interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
}

type HeaderLocale = 'fr' | 'en' | 'it' | 'es' | 'zh';

const LANGUAGE_OPTIONS: Array<{ key: HeaderLocale; label: string; short: string; mappedLanguage: 'fr' | 'en' }> = [
  { key: 'fr', label: 'Français', short: 'FRA', mappedLanguage: 'fr' },
  { key: 'en', label: 'English', short: 'ENG', mappedLanguage: 'en' },
  { key: 'it', label: 'Italiano', short: 'ITA', mappedLanguage: 'en' },
  { key: 'es', label: 'Español', short: 'ESP', mappedLanguage: 'en' },
  { key: 'zh', label: 'Mandarin', short: '中文', mappedLanguage: 'en' },
];

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const pathname = usePathname();
  
  // Tous les hooks doivent être appelés avant tout return conditionnel
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  // const [isSignModalOpen, setIsSignModalOpen] = useState(false); // Remplacé par redirection vers /auth/login
  // const [isAdminModalOpen, setIsAdminModalOpen] = useState(false); // Remplacé par redirection vers /auth/admin/login
  const { getCartItemCount } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { user } = useUser();
  const { signOut } = useAuth();
  const { isPro } = usePro();
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedLocale, setSelectedLocale] = useState<HeaderLocale>(language);

  const selectedLanguageOption = LANGUAGE_OPTIONS.find((option) => option.key === selectedLocale) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detectBrowserLocale = (): HeaderLocale => {
      const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

      for (const lang of browserLanguages) {
        const normalized = (lang || '').toLowerCase();
        if (normalized.startsWith('zh')) return 'zh';
        if (normalized.startsWith('it')) return 'it';
        if (normalized.startsWith('es')) return 'es';
        if (normalized.startsWith('en')) return 'en';
        if (normalized.startsWith('fr')) return 'fr';
      }

      return 'fr';
    };

    const syncLocale = () => {
      const storedLocale = localStorage.getItem('preferredLocale') as HeaderLocale | null;
      const resolvedLocale =
        storedLocale && LANGUAGE_OPTIONS.some((option) => option.key === storedLocale)
          ? storedLocale
          : detectBrowserLocale();

      if (!storedLocale) {
        localStorage.setItem('preferredLocale', resolvedLocale);
        window.dispatchEvent(new CustomEvent('preferredLocaleChanged', { detail: { locale: resolvedLocale } }));
      }

      setSelectedLocale(resolvedLocale);
      const mappedLanguage = resolvedLocale === 'fr' ? 'fr' : 'en';
      if (language !== mappedLanguage) {
        onLanguageChange(mappedLanguage);
      }
    };

    syncLocale();
    window.addEventListener('preferredLocaleChanged', syncLocale);
    window.addEventListener('storage', syncLocale);

    return () => {
      window.removeEventListener('preferredLocaleChanged', syncLocale);
      window.removeEventListener('storage', syncLocale);
    };
  }, [language, onLanguageChange]);
  
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
  }, [pathname, getCartItemCount]); // getCartItemCount est maintenant stable via useCallback

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
      } catch {
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

  // Ne pas afficher le bandeau noir sur les pages dashboard/admin et toutes les pages utilisateur (mes-*)
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/mes-');
  
  // Vérifier si on est dans l'espace pro
  const isProPage = pathname?.startsWith('/pro');
  
  // Afficher le minicart uniquement si pro active ET dans /pro/*
  const shouldShowMiniCart = isPro && isProPage;
  
  // Masquer le header sur les pages admin/dashboard/mes-*
  if (isDashboardPage) return null;

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

  const handleLanguageSelect = (locale: HeaderLocale) => {
    setSelectedLocale(locale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', locale);
      window.dispatchEvent(new CustomEvent('preferredLocaleChanged', { detail: { locale } }));
    }
    const targetLanguage = locale === 'fr' ? 'fr' : 'en';
    if (language !== targetLanguage) {
      onLanguageChange(targetLanguage);
    }
  };

  const texts = {
    fr: {
      solutions: 'Solutions',
      promesse: 'Promesse',
      clients: 'Clients',
      contact: 'Contact',
      conference: 'Conférence',
      soiree: 'Soirée',
      mariage: 'Mariage',
      blog: 'Blog',
      location: 'Location',
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
      promesse: 'Promise',
      clients: 'Clients',
      contact: 'Contact',
      conference: 'Conference',
      soiree: 'Party',
      mariage: 'Wedding',
      blog: 'Blog',
      location: 'Location',
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

  const localeTextOverrides = {
    fr: {
      commentChoosePack: 'Comment choisir son pack',
      quote: 'Devis',
      signIn: 'Connexion',
    },
    en: {
      commentChoosePack: 'How to choose your pack',
      quote: 'Quote',
      signIn: 'Sign in',
    },
    it: {
      solutions: 'Soluzioni',
      promesse: 'Promessa',
      clients: 'Clienti',
      contact: 'Contatto',
      conference: 'Conferenza',
      soiree: 'Festa',
      mariage: 'Matrimonio',
      blog: 'Blog',
      location: 'Noleggio',
      callNow: 'Chiama',
      account: 'Il mio account',
      reservations: 'Le mie prenotazioni',
      contracts: 'I miei contratti',
      signOut: 'Disconnetti',
      adminReservations: 'Prenotazioni',
      adminClients: 'Clienti',
      adminEtatsDesLieux: 'Verbali',
      commentChoosePack: 'Come scegliere il tuo pacchetto',
      quote: 'Preventivo',
      signIn: 'Accedi',
    },
    es: {
      solutions: 'Soluciones',
      promesse: 'Promesa',
      clients: 'Clientes',
      contact: 'Contacto',
      conference: 'Conferencia',
      soiree: 'Fiesta',
      mariage: 'Boda',
      blog: 'Blog',
      location: 'Alquiler',
      callNow: 'Llamar',
      account: 'Mi cuenta',
      reservations: 'Mis reservas',
      contracts: 'Mis contratos',
      signOut: 'Cerrar sesion',
      adminReservations: 'Reservas',
      adminClients: 'Clientes',
      adminEtatsDesLieux: 'Informes',
      commentChoosePack: 'Como elegir tu pack',
      quote: 'Presupuesto',
      signIn: 'Iniciar sesion',
    },
    zh: {
      solutions: '解决方案',
      promesse: '承诺',
      clients: '客户',
      contact: '联系',
      conference: '会议',
      soiree: '派对',
      mariage: '婚礼',
      blog: '博客',
      location: '租赁',
      callNow: '立即致电',
      account: '我的账户',
      reservations: '我的预订',
      contracts: '我的合同',
      signOut: '退出登录',
      adminReservations: '预订',
      adminClients: '客户',
      adminEtatsDesLieux: '验收报告',
      commentChoosePack: '如何选择您的套餐',
      quote: '获取报价',
      signIn: '登录',
    },
  };

  const currentTexts = {
    ...texts[language],
    ...(localeTextOverrides[selectedLocale] || localeTextOverrides.en),
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
              <Link 
                href="/#solutions"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {currentTexts.solutions}
              </Link>
              <Link 
                href="/#promesse"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('promesse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {currentTexts.promesse}
              </Link>
              <Link 
                href="/#trusted"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('trusted')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {currentTexts.clients}
              </Link>
              <Link 
                href="/#contact"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-sm whitespace-nowrap"
              >
                {currentTexts.contact}
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
                <a href="tel:+33744782754">
                  {currentTexts.callNow}
                </a>
              </Button>

              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Compte utilisateur - Desktop only (masqué quand non connecté) */}
              {user && (
              <div className="hidden lg:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                        aria-label={currentTexts.account}
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
                              {currentTexts.adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {currentTexts.adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {currentTexts.adminEtatsDesLieux}
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
                              {currentTexts.account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {currentTexts.reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {currentTexts.contracts}
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
                        {currentTexts.signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
              )}
              
              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Panier - Desktop only - Affiché uniquement si pro active ET dans /pro/* */}
              {shouldShowMiniCart && (
                <>
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
                </>
              )}
              
              {/* Language switcher - Desktop only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="font-semibold text-sm uppercase">{selectedLanguageOption.short}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.key}
                      onClick={() => handleLanguageSelect(option.key)}
                      className="cursor-pointer"
                    >
                      <span className={`font-semibold ${selectedLocale === option.key ? 'text-[#F2431E]' : ''}`}>
                        {option.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
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
                
                {/* CTA Appelez - Mobile - Icône téléphone à côté du toggle */}
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                  aria-label={currentTexts.callNow}
                >
                  <a href="tel:+33744782754">
                    <Phone className="h-6 w-6" />
                  </a>
                </Button>
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Panier Mobile - Affiché uniquement si pro active ET dans /pro/* */}
                {shouldShowMiniCart && (
                  <>
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
                  </>
                )}
                
                {/* Auth Icon - Mobile - Version compacte (masqué quand non connecté) */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                        aria-label={currentTexts.account}
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
                              {currentTexts.adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {currentTexts.adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {currentTexts.adminEtatsDesLieux}
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
                              {currentTexts.account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {currentTexts.reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {currentTexts.contracts}
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
                        {currentTexts.signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <DropdownMenuContent align="end" className="w-40">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.key}
                        onClick={() => handleLanguageSelect(option.key)}
                        className="cursor-pointer"
                      >
                        <span className={`font-semibold ${selectedLocale === option.key ? 'text-[#F2431E]' : ''}`}>
                          {option.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
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
            {/* Navigation Links - Mobile */}
            <div className="flex flex-col gap-2 pt-2">
              <Link 
                href="/#solutions"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {currentTexts.solutions}
              </Link>
              <Link 
                href="/#promesse"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('promesse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {currentTexts.promesse}
              </Link>
              <Link 
                href="/#trusted"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('trusted')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {currentTexts.clients}
              </Link>
              <Link 
                href="/#contact"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium text-base py-2"
              >
                {currentTexts.contact}
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
                  <span className="font-semibold text-sm uppercase">{selectedLanguageOption.short}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {LANGUAGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => handleLanguageSelect(option.key)}
                    className="cursor-pointer"
                  >
                    <span className={`font-semibold ${selectedLocale === option.key ? 'text-[#F2431E]' : ''}`}>
                      {option.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Mini Cart - Affiché uniquement si pro active ET dans /pro/* */}
      {shouldShowMiniCart && (
        <MiniCart
          isOpen={isMiniCartOpen}
          onClose={() => setIsMiniCartOpen(false)}
          language={language}
        />
      )}

      {/* Sign Modal - Remplacé par redirection vers /auth/login */}

      {/* Admin Sign Modal - Remplacé par redirection vers /auth/admin/login */}

    </header>
  );
}
