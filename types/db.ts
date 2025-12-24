// Types partagés pour les structures de base de données

/**
 * Item final dans une réservation (pack + extras)
 */
export interface FinalItem {
  id: string; // Identifiant unique de l'item
  label: string; // Nom de l'item (ex: "Enceinte", "Micro HF", "Caisson de basses")
  qty: number; // Quantité
  unitPrice?: number; // Prix unitaire (optionnel si inclus dans pack)
  isExtra: boolean; // true si c'est un extra (pas dans le pack de base)
  note?: string; // Note optionnelle pour l'admin
}

/**
 * Item extra ajouté par l'admin
 */
export interface ExtraItem {
  id: string;
  label: string;
  qty: number;
  unitPrice: number; // Prix unitaire obligatoire pour les extras
  note?: string;
}

/**
 * Structure complète d'une client_reservation (pour ajustement admin)
 */
export interface ClientReservation {
  id: string;
  pack_key: 'conference' | 'soiree' | 'mariage';
  start_at: string; // ISO date string
  end_at: string; // ISO date string
  address?: string | null;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: 'AWAITING_PAYMENT' | 'AWAITING_BALANCE' | 'CONFIRMED' | 'CANCELLED';
  
  // Pricing
  base_pack_price: number; // Prix de base du pack
  extras_total: number; // Total des extras
  price_total: number; // base_pack_price + extras_total
  deposit_amount?: number | null; // Montant de la caution (sécurité matériel)
  
  // Paiement 3 temps
  deposit_paid_at?: string | null; // Date de paiement acompte 30%
  balance_paid_at?: string | null; // Date de paiement solde 70%
  balance_amount?: number | null; // Montant du solde restant
  
  // Items et résumé
  final_items?: FinalItem[] | null; // Items finaux (pack + extras)
  customer_summary?: string | null; // Résumé client généré
  
  // Validation admin
  final_validated_at?: string | null; // Date de validation finale par l'admin
  
  // Métadonnées
  source?: string | null; // Origine: 'chat', 'admin', 'api', etc.
  chat_context?: Record<string, any> | null; // Contexte du chat si créé via chat
  
  created_at: string;
  updated_at: string;
}

/**
 * Item dans le panier
 */
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  rentalDays: number;
  startDate: string | null;
  endDate: string | null;
  startTime?: string | undefined;
  endTime?: string | undefined;
  dailyPrice: number;
  deposit: number;
  addons: Array<{ id: string; name: string; price: number }>;
  images?: string[];
  zone?: string;
  metadata?: {
    type?: string;
    relatedProductId?: string;
    relatedProductName?: string;
    urgencySurcharge?: number;
    [key: string]: any;
  };
}

/**
 * Panier complet
 */
export interface Cart {
  items: CartItem[];
  total: number;
  depositTotal: number;
}

/**
 * Produit du catalogue
 */
export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  category?: string | null;
  description?: string | null;
  long_description?: string | null;
  daily_price_ttc?: number;
  deposit?: number;
  quantity?: number;
  images?: string[] | null;
  specs?: any;
  tags?: string[] | null;
  features?: string[] | null;
  [key: string]: any; // Permettre d'autres propriétés dynamiques
}

/**
 * Réponse de disponibilité
 */
export interface AvailabilityResponse {
  available: boolean;
  remaining: number;
  bookedQuantity: number;
  totalQuantity: number;
}

/**
 * Plage de dates désactivées dans le calendrier
 */
export interface CalendarDisabledRange {
  start: string;
  end: string;
  reason?: string;
}

/**
 * Addon produit
 */
export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  description?: string;
}
