-- Migration: Ajout des champs de pricing base_pack_price et extras_total
-- Date: 2025-01-02

-- Ajouter base_pack_price pour stocker le prix de base du pack
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS base_pack_price numeric DEFAULT 0 CHECK (base_pack_price >= 0);

-- Ajouter extras_total pour stocker le total des extras ajoutés
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS extras_total numeric DEFAULT 0 CHECK (extras_total >= 0);

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.base_pack_price IS 'Prix de base du pack (sans extras)';
COMMENT ON COLUMN client_reservations.extras_total IS 'Total des extras ajoutés depuis le catalogue';
