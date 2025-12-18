-- Migration: Ajout des colonnes final_items et customer_summary à client_reservations
-- Date: 2025-01-02

-- Ajouter la colonne final_items (jsonb) pour stocker les items finaux du pack avec ajustements
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS final_items jsonb DEFAULT '[]'::jsonb;

-- Ajouter la colonne customer_summary (text) pour stocker le résumé client généré automatiquement
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS customer_summary text;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.final_items IS 'Items finaux du pack avec ajustements admin (format: [{"label": "Enceinte", "qty": 2}])';
COMMENT ON COLUMN client_reservations.customer_summary IS 'Résumé client généré automatiquement à partir des items finaux';
