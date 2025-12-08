// Types TypeScript pour les tables Supabase

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  daily_price_ttc: number;
  deposit: number;
  quantity: number;
  category: string | null;
  tags: string[] | null;
  images: string[] | null;
  specs: Record<string, any> | null;
  features: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  product_id: string | null;
  pack_id: string | null;
  quantity: number;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_option: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  deposit_total: number;
  status: OrderStatus;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  quantity: number;
  rental_days: number;
  start_date: string;
  end_date: string;
  daily_price: number;
  deposit: number;
  addons: ProductAddon[];
  images: string[] | null;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  rentalDays: number;
  startDate: string;
  endDate: string;
  dailyPrice: number;
  deposit: number;
  addons: ProductAddon[];
  images?: string[];
  // Détails de l'événement depuis l'assistant
  eventType?: string;
  startTime?: string;
  endTime?: string;
  zone?: string;
  // Metadata pour stocker des infos supplémentaires
  metadata?: Record<string, any>;
}

export interface Cart {
  items: CartItem[];
  total: number;
  depositTotal: number;
}

export interface AvailabilityResponse {
  available: boolean;
  remaining: number;
  bookedQuantity: number;
}

export interface CalendarDisabledRange {
  start: string;
  end: string;
}
