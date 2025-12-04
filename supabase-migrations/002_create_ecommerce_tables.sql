-- Migration SQL pour créer les tables e-commerce (products, reservations, orders)
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. TABLE PRODUCTS (si elle n'existe pas déjà)
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  daily_price_ttc DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  tags TEXT[],
  images TEXT[],
  specs JSONB,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLE RESERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  pack_id TEXT, -- Pour les packs (nullable)
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- Date exclue (exclusive)
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLE ORDERS (commandes)
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
-- 4. TABLE ORDER_ITEMS (items d'une commande)
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
-- 5. INDEX pour optimiser les requêtes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reservations_product_id ON public.reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pack_id ON public.reservations(pack_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- 6. Fonction pour mettre à jour updated_at automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Triggers pour updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at 
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Row Level Security (RLS)
-- ============================================

-- Products : lecture publique, écriture admin
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products are insertable by authenticated users" ON public.products;
CREATE POLICY "Products are insertable by authenticated users" ON public.products
  FOR INSERT WITH CHECK (true); -- À ajuster selon vos besoins d'auth

-- Reservations : lecture publique pour vérifier dispo, insertion publique
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reservations are viewable by everyone" ON public.reservations;
CREATE POLICY "Reservations are viewable by everyone" ON public.reservations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reservations are insertable by everyone" ON public.reservations;
CREATE POLICY "Reservations are insertable by everyone" ON public.reservations
  FOR INSERT WITH CHECK (true); -- À ajuster selon vos besoins d'auth

-- Orders : lecture et écriture pour les utilisateurs authentifiés (ou publique selon vos besoins)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;
CREATE POLICY "Orders are viewable by everyone" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Orders are insertable by everyone" ON public.orders;
CREATE POLICY "Orders are insertable by everyone" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Order Items : même politique que orders
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON public.order_items;
CREATE POLICY "Order items are viewable by everyone" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Order items are insertable by everyone" ON public.order_items;
CREATE POLICY "Order items are insertable by everyone" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. Données de démo (optionnel)
-- ============================================
-- Insérer quelques produits de démo si la table est vide
INSERT INTO public.products (name, slug, description, daily_price_ttc, deposit, quantity, category, tags, images, specs, features)
VALUES
  (
    'Enceinte active 15"',
    'enceinte-active-15',
    'Enceinte active professionnelle 15" 800W RMS, idéale pour événements jusqu\'à 200 personnes.',
    85.00,
    500.00,
    3,
    'sonorisation',
    ARRAY['Puissante', 'Indoor/Outdoor', 'Pro Quality'],
    ARRAY['/enceintebt.jpg'],
    '{"puissance": "800W RMS", "taille": "15 pouces", "connectivite": "XLR, Jack, Bluetooth", "poids": "28 kg", "dimensions": "46x36x66cm"}'::jsonb,
    ARRAY['800W RMS', '15-inch woofer', 'Bluetooth intégré']
  ),
  (
    'Pioneer XDJ-RX3',
    'pioneer-xdj-rx3',
    'Contrôleur DJ professionnel avec écran tactile.',
    120.00,
    800.00,
    2,
    'dj',
    ARRAY['Pro', 'Écran tactile', '4 canaux'],
    ARRAY['/platinedj.jpg'],
    '{"canaux": "4", "pads": "16", "connectivite": "USB, RCA, XLR"}'::jsonb,
    ARRAY['4 canaux', 'Écran tactile', '16 pads']
  ),
  (
    'Shure SM58',
    'shure-sm58',
    'Micro dynamique professionnel, référence mondiale.',
    25.00,
    150.00,
    10,
    'micros',
    ARRAY['Dynamique', 'Cardioïde', 'Pro'],
    ARRAY['/microshure.png'],
    '{"type": "Dynamique", "directivite": "Cardioïde", "frequence": "50Hz-15kHz"}'::jsonb,
    ARRAY['Cardioïde', 'Robuste', 'Son professionnel']
  ),
  (
    'Lyre LED',
    'lyre-led',
    'Éclairage dynamique LED pour ambiance.',
    45.00,
    200.00,
    5,
    'lumieres',
    ARRAY['LED', 'RGB', 'DMX'],
    ARRAY['/lyreled.png'],
    '{"puissance": "150W", "leds": "RGB", "dmx": "Oui"}'::jsonb,
    ARRAY['RGB', 'DMX', '150W']
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 10. Commentaires pour documentation
-- ============================================
COMMENT ON TABLE public.products IS 'Catalogue de produits disponibles à la location';
COMMENT ON TABLE public.reservations IS 'Réservations de produits/packs pour calculer la disponibilité';
COMMENT ON TABLE public.orders IS 'Commandes complètes avec paiement Stripe';
COMMENT ON TABLE public.order_items IS 'Items individuels d\'une commande';

