-- Migration SQL pour créer les tables ORDERS et ORDER_ITEMS
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. TABLE ORDERS (commandes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_option TEXT, -- 'paris', 'petite_couronne', 'grande_couronne', 'retrait'
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  deposit_total DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED')),
  metadata JSONB, -- Pour stocker les détails du panier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLE ORDER_ITEMS (items d'une commande)
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  rental_days INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_price DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) DEFAULT 0,
  addons JSONB DEFAULT '[]', -- Array d'addons sélectionnés
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEX pour optimiser les requêtes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- 4. Trigger pour updated_at sur orders
-- ============================================
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_orders_updated_at();

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;
CREATE POLICY "Orders are viewable by everyone" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Orders are insertable by everyone" ON public.orders;
CREATE POLICY "Orders are insertable by everyone" ON public.orders
  FOR INSERT WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON public.order_items;
CREATE POLICY "Order items are viewable by everyone" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Order items are insertable by everyone" ON public.order_items;
CREATE POLICY "Order items are insertable by everyone" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. Commentaires pour documentation
-- ============================================
COMMENT ON TABLE public.orders IS 'Commandes complètes avec paiement Stripe';
COMMENT ON TABLE public.order_items IS 'Items individuels d''une commande';

